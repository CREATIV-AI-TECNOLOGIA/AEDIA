import { DatabaseService } from '../services/DatabaseService'

async function verificarDadosExistentes() {
  console.log('🔍 Verificando dados existentes no banco...')
  
  try {
    // Verificar professores
    console.log('\n📚 Professores:')
    const professores = await DatabaseService.verificarProfessores()
    console.log(`Total encontrado: ${professores?.length || 0}`)
    if (professores && professores.length > 0) {
      console.log('Exemplos:', professores)
    }

    // Verificar disciplinas
    console.log('\n📖 Disciplinas:')
    const disciplinas = await DatabaseService.verificarDisciplinas()
    console.log(`Total encontrado: ${disciplinas?.length || 0}`)
    if (disciplinas && disciplinas.length > 0) {
      console.log('Exemplos:', disciplinas)
    }

    // Verificar relação professor-turmas
    console.log('\n🏫 Relação Professor-Turmas-Disciplinas:')
    const professorTurmas = await DatabaseService.verificarProfessorTurmas()
    console.log(`Total encontrado: ${professorTurmas?.length || 0}`)
    if (professorTurmas && professorTurmas.length > 0) {
      console.log('Exemplos:', professorTurmas)
    }

    // Verificar habilidades BNCC
    console.log('\n🎯 Habilidades BNCC V2:')
    const habilidades = await DatabaseService.verificarHabilidadesBNCC()
    console.log(`Total encontrado: ${habilidades?.length || 0}`)
    if (habilidades && habilidades.length > 0) {
      console.log('Exemplos:', habilidades.slice(0, 3))
    }

    // Verificar gêneros textuais
    console.log('\n📝 Gêneros Textuais:')
    const generos = await DatabaseService.verificarGenerosTextuais()
    console.log(`Total encontrado: ${generos?.length || 0}`)
    if (generos && generos.length > 0) {
      console.log('Exemplos:', generos)
    }

    console.log('\n✅ Verificação concluída!')
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error)
  }
}

// Executar verificação
verificarDadosExistentes()