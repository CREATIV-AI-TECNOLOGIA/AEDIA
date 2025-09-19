<html><head>
<link crossorigin="" href="https://fonts.gstatic.com/" rel="preconnect"/>
<link as="style" href="https://fonts.googleapis.com/css2?display=swap&amp;family=Manrope%3Awght%40400%3B500%3B700%3B800&amp;family=Noto+Sans%3Awght%40400%3B500%3B700%3B900" onload="this.rel='stylesheet'" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet"/>
<meta charset="utf-8"/>
<title>Stitch Design</title>
<link href="data:image/x-icon;base64," rel="icon" type="image/x-icon"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<style type="text/tailwindcss">
      :root {
        --primary-color: #137fec;
        --radio-dot-svg: url('data:image/svg+xml,%3csvg viewBox=%270 0 16 16%27 fill=%27%23137fec%27 xmlns=%27http://www.w3.org/2000/svg%27%3e%3ccircle cx=%278%27 cy=%278%27 r=%273%27/%3e%3c/svg%3e');
      }
      .custom-radio:checked {
        border-color: var(--primary-color);
        background-image: var(--radio-dot-svg);
      }
      .custom-radio:focus {
        box-shadow: 0 0 0 2px rgba(19, 127, 236, 0.5);
      }
    </style>
</head>
<body class="bg-slate-50">
<div class="relative flex size-full min-h-screen flex-col group/design-root" style='font-family: Manrope, "Noto Sans", sans-serif;'>
<div class="layout-container flex h-full grow flex-col">
<header class="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 bg-white px-10 py-3 shadow-sm">
<div class="flex items-center gap-4 text-slate-800">
<div class="size-6 text-[var(--primary-color)]">
<svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L1 9l11 7 9-7-2-1.25V14h-2V9.9l-7 4.38L3.62 9 12 4.38 20.38 9l-2.23 1.39L12 6.62 5.85 10.5 12 14.38l6.15-3.88L21.81 12 12 18.5 1 11.5v5.03l-1 .62V9l11-7 11 7v7.15l-2-.02V9.28L12 2z"></path></svg>
</div>
<h2 class="text-slate-900 text-lg font-bold leading-tight tracking-[-0.015em]">Educa</h2>
</div>
<div class="flex flex-1 justify-end gap-4">
<nav class="flex items-center gap-8">
<a class="text-slate-600 hover:text-slate-900 text-sm font-medium leading-normal" href="#">Início</a>
<a class="text-slate-600 hover:text-slate-900 text-sm font-medium leading-normal" href="#">Conteúdos</a>
<a class="text-slate-600 hover:text-slate-900 text-sm font-medium leading-normal" href="#">Comunidade</a>
</nav>
<div class="flex items-center gap-4">
<button class="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900">
<span class="material-symbols-outlined text-2xl">notifications</span>
</button>
<div class="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-white shadow-md" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuDHfY7eyUw6kA3jiRK0b-k9grSfLGMZvpTGCOMJ9yeAS9IkVYm8DiD56iJ8k1-cbgMWZFs_ymhaBKAhfsqila4S0y5o3wX9Qx2aPGGAw5aJvAUceldz6_f8MAhuKzrWp33VrnoIFmWzeVnBCvGedKRhPpLUC_-eH3Rhyof_lNuEHwC5G-kMCas1wUl58-cAgOgZ6a_to8A6vCLVeWvRRVjsAZGzXnejEg5VrI5eVRVsz_Mk3B4tynJNASsSLm3ho3Tb3A7co_V_25w");'></div>
</div>
</div>
</header>
<main class="flex flex-1 justify-center py-10">
<div class="flex w-full max-w-xl flex-col items-center">
<div class="flex flex-wrap items-center justify-center gap-3 p-3">
<div class="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-md bg-slate-200/80 px-3">
<p class="text-slate-700 text-sm font-medium leading-normal">Escola X</p>
</div>
<div class="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-md bg-slate-200/80 px-3">
<p class="text-slate-700 text-sm font-medium leading-normal">Matemática</p>
</div>
<div class="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-md bg-slate-200/80 px-3">
<p class="text-slate-700 text-sm font-medium leading-normal">3º ano</p>
</div>
</div>
<h1 class="text-slate-900 text-center text-3xl font-bold leading-tight pt-8 pb-6">Para qual turma deseja criar o plano de aula?</h1>
<div class="w-full space-y-4 p-4">
<label class="flex cursor-pointer items-center gap-4 rounded-lg border border-solid border-slate-300 bg-white p-4 shadow-sm transition-all hover:border-[var(--primary-color)] hover:shadow-md has-[:checked]:border-[var(--primary-color)] has-[:checked]:ring-2 has-[:checked]:ring-[var(--primary-color)] has-[:checked]:ring-offset-1">
<input checked="" class="custom-radio h-5 w-5 flex-shrink-0 border-2 border-slate-300 bg-transparent text-transparent focus:outline-none focus:ring-0 focus:ring-offset-0" name="class-selection" type="radio"/>
<div class="flex grow flex-col">
<p class="text-slate-800 text-base font-semibold leading-normal">Turma A</p>
<p class="text-slate-500 text-sm leading-normal">Manhã</p>
</div>
</label>
<label class="flex cursor-pointer items-center gap-4 rounded-lg border border-solid border-slate-300 bg-white p-4 shadow-sm transition-all hover:border-[var(--primary-color)] hover:shadow-md has-[:checked]:border-[var(--primary-color)] has-[:checked]:ring-2 has-[:checked]:ring-[var(--primary-color)] has-[:checked]:ring-offset-1">
<input class="custom-radio h-5 w-5 flex-shrink-0 border-2 border-slate-300 bg-transparent text-transparent focus:outline-none focus:ring-0 focus:ring-offset-0" name="class-selection" type="radio"/>
<div class="flex grow flex-col">
<p class="text-slate-800 text-base font-semibold leading-normal">Turma B</p>
<p class="text-slate-500 text-sm leading-normal">Tarde</p>
</div>
</label>
<label class="flex cursor-pointer items-center gap-4 rounded-lg border border-solid border-slate-300 bg-white p-4 shadow-sm transition-all hover:border-[var(--primary-color)] hover:shadow-md has-[:checked]:border-[var(--primary-color)] has-[:checked]:ring-2 has-[:checked]:ring-[var(--primary-color)] has-[:checked]:ring-offset-1">
<input class="custom-radio h-5 w-5 flex-shrink-0 border-2 border-slate-300 bg-transparent text-transparent focus:outline-none focus:ring-0 focus:ring-offset-0" name="class-selection" type="radio"/>
<div class="flex grow flex-col">
<p class="text-slate-800 text-base font-semibold leading-normal">Turma C</p>
<p class="text-slate-500 text-sm leading-normal">Noite</p>
</div>
</label>
</div>
<div class="mt-auto w-full p-4 pt-8">
<button class="flex min-w-[84px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-md h-12 px-5 bg-[var(--primary-color)] text-white text-base font-bold leading-normal tracking-wide shadow-lg shadow-[var(--primary-color)]/30 transition-all hover:bg-[var(--primary-color)]/90 hover:shadow-xl hover:shadow-[var(--primary-color)]/40 focus:outline-none focus:ring-4 focus:ring-[var(--primary-color)]/50">
<span class="truncate">Continuar</span>
</button>
</div>
</div>
</main>
</div>
</div>

</body></html>