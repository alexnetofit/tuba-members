export type Role = "aluno" | "admin";
export type Alternativa = "a" | "b" | "c" | "d" | "e";

export type TubaProfile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: Role;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

export type TubaDisciplina = {
  id: string;
  nome: string;
  slug: string;
  cor: string;
  icone: string | null;
  ordem: number;
  ativa: boolean;
  created_at: string;
};

export type TubaAula = {
  id: string;
  disciplina_id: string;
  titulo: string;
  descricao: string | null;
  youtube_url: string;
  duracao_min: number | null;
  ordem: number;
  publicada: boolean;
  created_at: string;
  updated_at: string;
};

export type TubaAulaMaterial = {
  id: string;
  aula_id: string;
  nome: string;
  url_storage: string;
  tipo: string | null;
  tamanho_bytes: number | null;
  created_at: string;
};

export type TubaAulaAssistida = {
  user_id: string;
  aula_id: string;
  assistida_em: string;
};

export type TubaSimulado = {
  id: string;
  titulo: string;
  descricao: string | null;
  disciplina_id: string | null;
  duracao_minutos: number;
  pdf_original_url: string | null;
  publicado: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type TubaQuestao = {
  id: string;
  simulado_id: string;
  numero: number;
  enunciado: string;
  alt_a: string;
  alt_b: string;
  alt_c: string;
  alt_d: string;
  alt_e: string | null;
  gabarito: Alternativa;
  comentario: string | null;
  created_at: string;
};

export type TubaTentativa = {
  id: string;
  user_id: string;
  simulado_id: string;
  iniciado_em: string;
  finalizado_em: string | null;
  nota: number | null;
  acertos: number | null;
  total_questoes: number | null;
  tempo_segundos: number | null;
};

export type TubaResposta = {
  id: string;
  tentativa_id: string;
  questao_id: string;
  alternativa_marcada: Alternativa | null;
  correta: boolean | null;
  respondida_em: string;
};

export type TubaConquista = {
  id: string;
  codigo: string;
  nome: string;
  descricao: string;
  icone: string;
  pontos_bonus: number;
  ordem: number;
  created_at: string;
};

export type TubaUsuarioConquista = {
  user_id: string;
  conquista_id: string;
  conquistado_em: string;
};

export type TubaRankingGeralRow = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  simulados_feitos: number;
  pontos: number;
  media_geral: number;
  conquistas: number;
  posicao: number;
};

export type TubaRankingDisciplinaRow = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  disciplina_id: string;
  disciplina_nome: string;
  simulados_feitos: number;
  pontos: number;
  media: number;
  posicao: number;
};

/* ============================================================
 * Database type estrutura compativel com @supabase/postgrest-js
 * (precisa de Tables/Views/Functions com Relationships: [])
 * ============================================================ */

export type Database = {
  public: {
    Tables: {
      tuba_profiles: {
        Row: TubaProfile;
        Insert: Partial<TubaProfile> & Pick<TubaProfile, "id" | "email">;
        Update: Partial<TubaProfile>;
        Relationships: [];
      };
      tuba_disciplinas: {
        Row: TubaDisciplina;
        Insert: Partial<TubaDisciplina> & Pick<TubaDisciplina, "nome" | "slug">;
        Update: Partial<TubaDisciplina>;
        Relationships: [];
      };
      tuba_aulas: {
        Row: TubaAula;
        Insert: Partial<TubaAula> & Pick<TubaAula, "titulo" | "disciplina_id" | "youtube_url">;
        Update: Partial<TubaAula>;
        Relationships: [
          {
            foreignKeyName: "tuba_aulas_disciplina_id_fkey";
            columns: ["disciplina_id"];
            isOneToOne: false;
            referencedRelation: "tuba_disciplinas";
            referencedColumns: ["id"];
          },
        ];
      };
      tuba_aula_materiais: {
        Row: TubaAulaMaterial;
        Insert: Partial<TubaAulaMaterial> & Pick<TubaAulaMaterial, "aula_id" | "nome" | "url_storage">;
        Update: Partial<TubaAulaMaterial>;
        Relationships: [];
      };
      tuba_aulas_assistidas: {
        Row: TubaAulaAssistida;
        Insert: TubaAulaAssistida;
        Update: Partial<TubaAulaAssistida>;
        Relationships: [
          {
            foreignKeyName: "tuba_aulas_assistidas_aula_id_fkey";
            columns: ["aula_id"];
            isOneToOne: false;
            referencedRelation: "tuba_aulas";
            referencedColumns: ["id"];
          },
        ];
      };
      tuba_simulados: {
        Row: TubaSimulado;
        Insert: Partial<TubaSimulado> & Pick<TubaSimulado, "titulo">;
        Update: Partial<TubaSimulado>;
        Relationships: [
          {
            foreignKeyName: "tuba_simulados_disciplina_id_fkey";
            columns: ["disciplina_id"];
            isOneToOne: false;
            referencedRelation: "tuba_disciplinas";
            referencedColumns: ["id"];
          },
        ];
      };
      tuba_questoes: {
        Row: TubaQuestao;
        Insert: Partial<TubaQuestao> &
          Pick<TubaQuestao, "simulado_id" | "numero" | "enunciado" | "alt_a" | "alt_b" | "alt_c" | "alt_d" | "gabarito">;
        Update: Partial<TubaQuestao>;
        Relationships: [];
      };
      tuba_tentativas: {
        Row: TubaTentativa;
        Insert: Partial<TubaTentativa> & Pick<TubaTentativa, "user_id" | "simulado_id">;
        Update: Partial<TubaTentativa>;
        Relationships: [
          {
            foreignKeyName: "tuba_tentativas_simulado_id_fkey";
            columns: ["simulado_id"];
            isOneToOne: false;
            referencedRelation: "tuba_simulados";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tuba_tentativas_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "tuba_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tuba_respostas: {
        Row: TubaResposta;
        Insert: Partial<TubaResposta> & Pick<TubaResposta, "tentativa_id" | "questao_id">;
        Update: Partial<TubaResposta>;
        Relationships: [];
      };
      tuba_conquistas: {
        Row: TubaConquista;
        Insert: Partial<TubaConquista> & Pick<TubaConquista, "codigo" | "nome" | "descricao" | "icone">;
        Update: Partial<TubaConquista>;
        Relationships: [];
      };
      tuba_usuario_conquistas: {
        Row: TubaUsuarioConquista;
        Insert: TubaUsuarioConquista;
        Update: Partial<TubaUsuarioConquista>;
        Relationships: [
          {
            foreignKeyName: "tuba_usuario_conquistas_conquista_id_fkey";
            columns: ["conquista_id"];
            isOneToOne: false;
            referencedRelation: "tuba_conquistas";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      tuba_ranking_geral: {
        Row: TubaRankingGeralRow;
        Relationships: [];
      };
      tuba_ranking_disciplina: {
        Row: TubaRankingDisciplinaRow;
        Relationships: [];
      };
    };
    Functions: {
      tuba_dashboard_aluno: {
        Args: { p_user_id: string };
        Returns: Record<string, unknown>;
      };
      tuba_progresso_disciplinas: {
        Args: { p_user_id: string };
        Returns: Array<{
          id: string;
          nome: string;
          cor: string;
          ordem: number;
          total_aulas: number;
          assistidas: number;
        }>;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
