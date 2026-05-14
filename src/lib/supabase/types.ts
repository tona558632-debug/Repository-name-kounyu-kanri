// このファイルは `npm run supabase:gen-types` で自動生成されます。
// Supabase プロジェクト作成後、SUPABASE_PROJECT_REF を設定して再生成してください。
//
// 一時的なプレースホルダ型。実装初期段階で型チェックが通るように最小限の Database 型を定義。
// 実プロジェクト適用後は CLI から自動生成された定義に差し替わります。

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
