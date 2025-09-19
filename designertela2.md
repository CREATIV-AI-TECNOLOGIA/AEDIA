<html><head>
<meta charset="utf-8"/>
<link crossorigin="" href="https://fonts.gstatic.com/" rel="preconnect"/>
<link as="style" href="https://fonts.googleapis.com/css2?display=swap&amp;family=Manrope%3Awght%40400%3B500%3B700%3B800&amp;family=Noto+Sans%3Awght%40400%3B500%3B700%3B900" onload="this.rel='stylesheet'" rel="stylesheet"/>
<title>Stitch Design</title>
<link href="data:image/x-icon;base64," rel="icon" type="image/x-icon"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<style type="text/tailwindcss">
      :root {
        --primary-50: #eff6ff;
        --primary-100: #dbeafe;
        --primary-200: #bfdbfe;
        --primary-300: #93c5fd;
        --primary-400: #60a5fa;
        --primary-500: #3b82f6;
        --primary-600: #2563eb;
        --primary-700: #1d4ed8;
        --primary-800: #1e40af;
        --primary-900: #1e3a8a;
      }
      .radio-label:has(:checked) {
        border-color: #1d4ed8;
        background-color: #eff6ff;
        color: #1e40af;
        font-weight: 600;
      }
      .radio-label:hover {
        border-color: #93c5fd;
      }
      .radio-label:has(:checked):hover {
        border-color: #1d4ed8;
      }
    </style>
</head>
<body class="bg-gray-50 text-gray-800" style='font-family: Manrope, "Noto Sans", sans-serif;'>
<div class="flex min-h-screen flex-col">
<header class="fixed top-0 left-0 right-0 bg-white shadow-sm z-10">
<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
<div class="flex h-16 items-center justify-between">
<div class="flex items-center gap-4">
<div class="flex h-8 items-center justify-center gap-x-2 rounded-full bg-gray-100 px-4 py-1.5">
<p class="text-sm font-medium text-gray-700">Escola X | Matemática | 3º ano | Turma Y</p>
</div>
</div>
</div>
</div>
<div class="w-full bg-gray-200">
<div class="bg-blue-600 h-1" style="width: 25%"></div>
</div>
</header>
<main class="flex flex-grow items-center justify-center pt-16">
<div class="w-full max-w-xl px-4 py-10 text-center">
<div class="mb-8">
<ol class="flex items-center justify-center space-x-2 sm:space-x-4 text-sm font-medium text-center text-gray-500">
<li class="flex items-center text-blue-600">
                            Tipo de Período
                            <svg class="ml-2 sm:ml-4 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>
</li>
<li class="flex items-center">
                            Datas
                            <svg class="ml-2 sm:ml-4 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>
</li>
<li class="flex items-center">
                            Conteúdo
                             <svg class="ml-2 sm:ml-4 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>
</li>
<li class="flex items-center">
                            Resumo/Confirmação
                        </li>
</ol>
</div>
<h1 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Para qual período deseja criar o plano?</h1>
<p class="mt-4 text-lg text-gray-600">Escolha uma das opções abaixo para definir a duração do seu plano de aula.</p>
<div class="mt-10 flex justify-center gap-4">
<label class="radio-label flex-1 cursor-pointer rounded-lg border-2 border-gray-300 bg-white p-6 text-center transition-all duration-200 ease-in-out max-w-xs">
<input checked="" class="sr-only" name="period" type="radio" value="trimestre"/>
<span class="text-lg font-semibold">Trimestre</span>
<p class="text-sm text-gray-500 mt-1">Plano de aula dividido em três meses.</p>
</label>
<label class="radio-label flex-1 cursor-pointer rounded-lg border-2 border-gray-300 bg-white p-6 text-center transition-all duration-200 ease-in-out max-w-xs">
<input class="sr-only" name="period" type="radio" value="bimestre"/>
<span class="text-lg font-semibold">Bimestre</span>
<p class="text-sm text-gray-500 mt-1">Plano de aula dividido em dois meses.</p>
</label>
</div>
</div>
</main>
<footer class="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-200">
<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
<div class="flex h-20 items-center justify-end">
<button class="rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors">
                        Continuar
                    </button>
</div>
</div>
</footer>
</div>

</body></html>