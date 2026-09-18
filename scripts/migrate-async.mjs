// Migração mecânica única: propagação de await pelo grafo de símbolos TypeScript.
import ts from 'typescript';
import fs from 'node:fs';

const config = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, process.cwd());
const program = ts.createProgram(parsed.fileNames, parsed.options);
const checker = program.getTypeChecker();
const sources = program.getSourceFiles().filter((s) => s.fileName.replaceAll('\\', '/').includes('/src/') && !s.isDeclarationFile && !s.fileName.includes('node_modules'));
const eligible = sources.filter((s) => !s.text.startsWith("'use client'") && !s.text.startsWith('"use client"') && !/\/(db|seed|schema)\.ts$/.test(s.fileName.replaceAll('\\', '/')));
const asyncFns = new Set();
const awaitedCalls = new Set();
const asyncMaps = new Set();
const isFn = (n) => ts.isFunctionDeclaration(n) || ts.isFunctionExpression(n) || ts.isArrowFunction(n) || ts.isMethodDeclaration(n);
function walk(n, cb) { cb(n); ts.forEachChild(n, (child) => walk(child, cb)); }
for (const s of sources) walk(s, (n) => { if (isFn(n) && n.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword)) asyncFns.add(n); });
function nearestFn(n) { while (n && !isFn(n)) n = n.parent; return n; }
function resolveFn(expression) {
  if (isFn(expression)) return expression;
  let symbol = checker.getSymbolAtLocation(expression);
  if (symbol?.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);
  const d = symbol?.valueDeclaration;
  return d && ts.isVariableDeclaration(d) ? d.initializer : d;
}
let changed = true;
while (changed) {
  changed = false;
  for (const s of eligible) walk(s, (n) => {
    if (!ts.isCallExpression(n)) return;
    const declaration = checker.getResolvedSignature(n)?.declaration;
    const isAsync = asyncFns.has(declaration) || asyncFns.has(resolveFn(n.expression));
    const method = ts.isPropertyAccessExpression(n.expression) ? n.expression.name.text : '';
    const mapAsync = ['map', 'forEach'].includes(method) && n.arguments[0] && asyncFns.has(resolveFn(n.arguments[0]));
    if (isAsync) awaitedCalls.add(n);
    if (mapAsync) asyncMaps.add(n);
    if (isAsync || mapAsync) {
      const owner = nearestFn(n.parent);
      if (owner && !asyncFns.has(owner)) { asyncFns.add(owner); changed = true; }
    }
  });
}
const f = ts.factory;
const promiseType = (type) => !type || (ts.isTypeReferenceNode(type) && type.typeName.getText() === 'Promise') ? type : f.createTypeReferenceNode('Promise', [type]);
const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
let changedFiles = 0;
for (const source of eligible) {
  let touched = false;
  const result = ts.transform(source, [(context) => {
    const visit = (node) => {
      let updated = ts.visitEachChild(node, visit, context);
      if (isFn(node) && asyncFns.has(node) && !node.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword)) {
        touched = true;
        const modifiers = [...(updated.modifiers ?? []), f.createModifier(ts.SyntaxKind.AsyncKeyword)];
        if (ts.isFunctionDeclaration(updated)) updated = f.updateFunctionDeclaration(updated, modifiers, updated.asteriskToken, updated.name, updated.typeParameters, updated.parameters, promiseType(updated.type), updated.body);
        else if (ts.isArrowFunction(updated)) updated = f.updateArrowFunction(updated, modifiers, updated.typeParameters, updated.parameters, promiseType(updated.type), updated.equalsGreaterThanToken, updated.body);
        else if (ts.isFunctionExpression(updated)) updated = f.updateFunctionExpression(updated, modifiers, updated.asteriskToken, updated.name, updated.typeParameters, updated.parameters, promiseType(updated.type), updated.body);
      }
      if (asyncMaps.has(node)) {
        touched = true;
        if (updated.expression.name.text === 'forEach') updated = f.updateCallExpression(updated, f.updatePropertyAccessExpression(updated.expression, updated.expression.expression, 'map'), updated.typeArguments, updated.arguments);
        updated = f.createCallExpression(f.createPropertyAccessExpression(f.createIdentifier('Promise'), 'all'), undefined, [updated]);
        return f.createParenthesizedExpression(f.createAwaitExpression(updated));
      }
      if (awaitedCalls.has(node) && !ts.isAwaitExpression(node.parent)) {
        touched = true;
        return f.createParenthesizedExpression(f.createAwaitExpression(updated));
      }
      return updated;
    };
    return (node) => ts.visitNode(node, visit);
  }]);
  if (touched) { fs.writeFileSync(source.fileName, printer.printFile(result.transformed[0])); changedFiles++; }
  result.dispose();
}
console.log(`Migração mecânica: ${changedFiles} arquivos. Revisar transações e executar typecheck.`);
