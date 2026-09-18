'use client';
export function PrintButton() { return <button className="button print:hidden" onClick={() => window.print()}>Imprimir ou salvar como PDF</button>; }
