import { PostgrestError } from '@supabase/supabase-js';

export interface SupabaseErrorInfo {
  isRLSError: boolean;
  isNotFoundError: boolean;
  isMultipleRowsError: boolean;
  shouldRetry: boolean;
  userMessage: string;
  technicalMessage: string;
}

export function analyzeSupabaseError(error: PostgrestError | null): SupabaseErrorInfo | null {
  if (!error) return null;

  const errorMessage = error.message.toLowerCase();
  const errorCode = error.code;

  return {
    isRLSError: errorCode === '42501' || errorMessage.includes('rls') || errorMessage.includes('policy'),
    isNotFoundError: errorMessage.includes('no rows') || errorMessage.includes('not found'),
    isMultipleRowsError: errorMessage.includes('multiple') && errorMessage.includes('rows'),
    shouldRetry: errorCode === '08000' || errorCode === '08003' || errorCode === '08006',
    userMessage: getUserFriendlyMessage(error),
    technicalMessage: error.message
  };
}

function getUserFriendlyMessage(error: PostgrestError): string {
  const errorMessage = error.message.toLowerCase();
  
  if (errorMessage.includes('rls') || errorMessage.includes('policy')) {
    return 'Acesso negado. Verifique suas permissões.';
  }
  
  if (errorMessage.includes('multiple') && errorMessage.includes('rows')) {
    return 'Dados duplicados encontrados no sistema.';
  }
  
  if (errorMessage.includes('no rows') || errorMessage.includes('not found')) {
    return 'Dados não encontrados.';
  }
  
  if (error.code === '08000' || error.code === '08003' || error.code === '08006') {
    return 'Problema de conexão. Tentando novamente...';
  }
  
  return 'Erro interno do sistema.';
}

export function logSupabaseError(context: string, error: PostgrestError, additionalInfo?: any) {
  const errorInfo = analyzeSupabaseError(error);
  
  if (errorInfo?.isRLSError) {
    console.warn(`[${context}] RLS Policy Error:`, errorInfo.userMessage);
  } else if (errorInfo?.isNotFoundError) {
    console.info(`[${context}] Data not found:`, errorInfo.userMessage);
  } else if (errorInfo?.isMultipleRowsError) {
    console.warn(`[${context}] Multiple rows error:`, errorInfo.userMessage, additionalInfo);
  } else {
    console.error(`[${context}] Supabase Error:`, errorInfo?.technicalMessage || error.message, additionalInfo);
  }
} 