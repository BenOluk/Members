import type { CourseCategory, Badge } from '../domain/entities';
export const mockCategories: CourseCategory[] = [
  { id: 'hermetismo',    label: 'Hermetismo',     description: 'Kybalion, alquimia interior e magia prática.',    accent: '#b08a3e' },
  { id: 'high-thinking', label: 'High Thinking',  description: 'Pensar em sistemas, superar autossabotagem.',     accent: '#c9a244' },
  { id: 'ia',            label: 'IA & Tecnologia', description: 'Engenharia de prompts, agentes, workflows.',     accent: '#7ba8d4' },
  { id: 'copy',          label: 'Copywriting',    description: 'Narrativa, persuasão ética e voz autêntica.',    accent: '#c4826a' },
  { id: 'astrologia',    label: 'Astrologia',     description: 'Arquétipos, mapa natal e sincronicidade.',       accent: '#8ba8cc' },
  { id: 'livre',         label: 'Mente Livre',    description: 'Autonomia intelectual e desescolarização.',      accent: '#7aae8e' },
];

// ---------- Badges ---------------------------------------------------------

export const mockBadges: Badge[] = [
  { id: 'b_primeiro_passo', name: 'Primeiro Passo',     description: 'Completou a primeira aula.',                  icon: 'footprints',     rarity: 'common' },
  { id: 'b_constante',       name: 'Ritmo Constante',    description: 'Estudou 7 dias seguidos.',                    icon: 'flame',          rarity: 'common' },
  { id: 'b_ordem',           name: 'Da Ordem',           description: 'Publicou seu primeiro post na comunidade.',   icon: 'book-open',      rarity: 'common' },
  { id: 'b_iluminado',       name: 'Iluminado',          description: 'Concluiu uma trilha inteira.',                icon: 'sparkles',       rarity: 'rare' },
  { id: 'b_catalisador',     name: 'Catalisador',        description: 'Recebeu 50 curtidas em um único post.',       icon: 'zap',            rarity: 'rare' },
  { id: 'b_quiron',          name: 'Quiron',             description: 'Respondeu a 10 dúvidas de outros alunos.',    icon: 'life-buoy',      rarity: 'rare' },
  { id: 'b_grao_mestre',     name: 'Grão-Mestre',        description: 'Convite direto do Sanctum.',                  icon: 'crown',          rarity: 'legendary' },
];
