<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sistema de Gestão Escolar</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/feather-icons"></script>
    <script src="https://cdn.jsdelivr.net/npm/feather-icons/dist/feather.min.js"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'school-blue': '#3b82f6',
                        'school-blue-dark': '#1e40af',
                        'school-blue-light': '#dbeafe',
                        'school-sidebar': '#ffffff',
                        'school-sidebar-hover': '#eff6ff',
                        'school-sidebar-active': '#000000',
                        'sidebar-background': '#f8fafc',
                        'sidebar-foreground': '#334155',
                        'sidebar-primary': '#1e293b',
                        'sidebar-primary-foreground': '#f1f5f9',
                        'sidebar-accent': '#f1f5f9',
                        'sidebar-accent-foreground': '#1e293b',
                        'sidebar-border': '#e2e8f0',
                        'sidebar-ring': '#3b82f6',
                    },
                    borderRadius: {
                        'lg': '0.75rem',
                    }
                }
            }
        }
    </script>
    <style>
        .sidebar-collapsed {
            width: 5rem;
        }
        .sidebar-expanded {
            width: 16rem;
        }
        .nav-item-active {
            background-color: #000000 !important;
            color: #ffffff !important;
        }
        .nav-item-hover:hover {
            background-color: #eff6ff;
            color: #1e40af;
            transform: translateX(4px);
            transition: all 0.2s ease;
        }
        .nav-item-hover:active {
            transform: scale(0.98);
        }
        @media (max-width: 768px) {
            .sidebar-mobile {
                transform: translateX(-100%);
            }
            .sidebar-mobile-open {
                transform: translateX(0);
            }
        }
        /* Prevent horizontal scrollbar */
        aside {
            overflow-x: hidden;
        }
        nav {
            overflow-x: hidden;
        }
    </style>
</head>
<body class="bg-gray-50 flex h-screen overflow-hidden">
    <!-- Sidebar -->
    <aside id="sidebar" class="sidebar-expanded bg-school-sidebar border-r border-sidebar-border h-full fixed md:relative transition-all duration-200 z-50 sidebar-mobile md:sidebar-mobile-open">
        <div class="p-4 h-full flex flex-col overflow-hidden">
            <!-- Header -->
            <div class="flex items-center gap-3 mb-8">
                <div class="w-8 h-8 bg-school-blue rounded-lg flex items-center justify-center">
                    <i data-feather="book" class="h-5 w-5 text-white"></i>
                </div>
                <div id="sidebar-header-text">
                    <h2 class="text-lg font-semibold text-foreground">Escola Digital</h2>
                    <p class="text-sm text-muted-foreground">Sistema de Gestão</p>
                </div>
            </div>

            <!-- Navigation -->
            <nav class="flex-1 overflow-y-auto">
                <ul class="space-y-2">
                    <li>
                        <a href="/" class="flex items-center gap-3 h-12 rounded-xl px-4 transition-all duration-200 text-muted-foreground nav-item-hover">
                            <i data-feather="home" class="h-5 w-5 flex-shrink-0"></i>
                            <span class="font-medium">Home</span>
                        </a>
                    </li>
                    <li>
                        <a href="/planos" class="flex items-center gap-3 h-12 rounded-xl px-4 transition-all duration-200 text-muted-foreground nav-item-hover">
                            <i data-feather="book-open" class="h-5 w-5 flex-shrink-0"></i>
                            <span class="font-medium">Planos de Aula</span>
                        </a>
                    </li>
                    <li>
                        <a href="/calendario" class="flex items-center gap-3 h-12 rounded-xl px-4 transition-all duration-200 text-muted-foreground nav-item-hover">
                            <i data-feather="calendar" class="h-5 w-5 flex-shrink-0"></i>
                            <span class="font-medium">Calendário</span>
                        </a>
                    </li>
                    <li>
                        <a href="/avaliacoes" class="flex items-center gap-3 h-12 rounded-xl px-4 transition-all duration-200 text-muted-foreground nav-item-hover">
                            <i data-feather="clipboard" class="h-5 w-5 flex-shrink-0"></i>
                            <span class="font-medium">Avaliações</span>
                        </a>
                    </li>
                    <li>
                        <a href="/notificacoes" class="flex items-center gap-3 h-12 rounded-xl px-4 transition-all duration-200 text-muted-foreground nav-item-hover">
                            <i data-feather="bell" class="h-5 w-5 flex-shrink-0"></i>
                            <span class="font-medium">Notificações</span>
                        </a>
                    </li>
                    <li>
                        <a href="/turmas" class="flex items-center gap-3 h-12 rounded-xl px-4 transition-all duration-200 text-muted-foreground nav-item-hover">
                            <i data-feather="users" class="h-5 w-5 flex-shrink-0"></i>
                            <span class="font-medium">Turmas</span>
                        </a>
                    </li>
                    <li>
                        <a href="/configuracoes" class="flex items-center gap-3 h-12 rounded-xl px-4 transition-all duration-200 text-muted-foreground nav-item-hover">
                            <i data-feather="settings" class="h-5 w-5 flex-shrink-0"></i>
                            <span class="font-medium">Configurações</span>
                        </a>
                    </li>
                    <li>
                        <a href="/assistente" class="flex items-center gap-3 h-12 rounded-xl px-4 transition-all duration-200 text-muted-foreground nav-item-hover">
                            <i data-feather="message-circle" class="h-5 w-5 flex-shrink-0"></i>
                            <span class="font-medium">Assistente</span>
                        </a>
                    </li>
                </ul>
            </nav>

            <!-- Bottom Section -->
            <div class="pt-4">
                <a href="#" class="flex items-center gap-3 h-12 rounded-xl px-4 transition-all duration-200 text-red-500 hover:bg-red-50 hover:text-red-600">
                    <i data-feather="log-out" class="h-5 w-5 flex-shrink-0"></i>
                    <span class="font-medium">Sair</span>
                </a>
            </div>
        </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col overflow-hidden">
        <!-- Mobile Header -->
        <header class="h-14 flex items-center border-b bg-white lg:hidden px-4">
            <button id="sidebar-toggle" class="text-school-blue">
                <i data-feather="menu" class="h-5 w-5"></i>
            </button>
            <h1 class="ml-3 font-semibold">Escola Digital</h1>
        </header>

        <!-- Content Area -->
        <div class="flex-1 overflow-auto p-6">
            <div class="max-w-7xl mx-auto">
                <!-- Conteúdo removido conforme solicitado -->
            </div>
        </div>
    </main>

    <script>
        // Toggle sidebar
        document.getElementById('sidebar-toggle').addEventListener('click', function() {
            const sidebar = document.getElementById('sidebar');
            const headerText = document.getElementById('sidebar-header-text');
            
            sidebar.classList.toggle('sidebar-collapsed');
            sidebar.classList.toggle('sidebar-expanded');
            headerText.classList.toggle('hidden');
            
            // Toggle text in navigation items
            document.querySelectorAll('nav span').forEach(span => {
                span.classList.toggle('hidden');
            });
        });

        // Initialize feather icons
        feather.replace();
        
        // Active page detection and management
        function setActiveNavItem() {
            const currentPath = window.location.pathname;
            document.querySelectorAll('nav a').forEach(link => {
                if(link.getAttribute('href') === currentPath) {
                    link.classList.add('nav-item-active');
                    link.classList.remove('text-muted-foreground');
                    // Remove hover effects from active item
                    link.classList.remove('nav-item-hover');
                } else {
                    link.classList.remove('nav-item-active');
                    link.classList.add('text-muted-foreground');
                    // Add hover effects back to non-active items
                    if (!link.classList.contains('nav-item-hover')) {
                        link.classList.add('nav-item-hover');
                    }
                }
            });
        }

        // Set active item on page load
        setActiveNavItem();

        // Update active state when links are clicked
        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', function(e) {
                // Remove active class from all links
                document.querySelectorAll('nav a').forEach(l => {
                    l.classList.remove('nav-item-active');
                    l.classList.add('text-muted-foreground');
                    // Add hover effects back to all items
                    if (!l.classList.contains('nav-item-hover')) {
                        l.classList.add('nav-item-hover');
                    }
                });
                
                // Add active class to clicked link
                this.classList.add('nav-item-active');
                this.classList.remove('text-muted-foreground');
                // Remove hover effects from active item
                this.classList.remove('nav-item-hover');
            });
        });
    </script>
</body>
</html>