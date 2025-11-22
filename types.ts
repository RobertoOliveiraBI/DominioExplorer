export interface DomainFilterState {
  minLength: number;
  maxLength: number;
  startsWith: string;
  hasNumbers: 'all' | 'yes' | 'no';
  extension: 'all' | 'com.br' | 'others';
  firstLetter: string;
  searchTerm: string;
  semanticKeywords: string[];
}

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
}

export interface DomainStats {
  total: number;
  byLength: { name: string; value: number }[];
  byLetter: { name: string; value: number }[];
}

export const PROXY_URL = "https://api.allorigins.win/raw?url=";
export const SOURCE_URL = "https://registro.br/dominio/lista-processo-liberacao.txt";