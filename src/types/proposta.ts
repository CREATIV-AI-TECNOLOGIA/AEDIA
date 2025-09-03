export interface ItemProposta {
  ano: string;
  componente: string;
  unidadeTematica: string;
  objetoConhecimento: string;
  habilidades: string[];
}

export interface PropostaCurricular {
  nome: string;
  versao: string;
  dataImportacao: string;
  items: ItemProposta[];
} 