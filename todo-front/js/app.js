document.addEventListener('DOMContentLoaded', function () {
    const BASE_URL = 'http://localhost:8080'; // Базовый URL сервера

    // Проверка токена и перенаправление (только на главной странице и странице входа)
    const isIndexPage = window.location.pathname.endsWith('index.html');
    const isLoginPage = window.location.pathname.endsWith('login.html');

    if (localStorage.getItem('token') && (isIndexPage || isLoginPage)) {
        window.location.href = 'profile.html';
    }

    // Функция для форматирования даты и времени
    function formatDateTime(dateTimeString) {
        const date = new Date(dateTimeString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Месяцы начинаются с 0
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${day}.${month}.${year} ${hours}:${minutes}`;
    }

    // Обработчик для регистрации
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch(`${BASE_URL}/api/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, email, password }),
                });

                // Обработка ответа сервера
                if (response.ok) {
                    const data = await response.json();
                    alert('Регистрация прошла успешно!');
                    window.location.href = 'login.html';
                } else {
                    // Если статус ответа 400 (Bad Request)
                    const errorData = await response.json();
                    if (errorData.message === 'Username already taken') {
                        alert('Ошибка: Имя пользователя уже занято.');
                    } else {
                        alert('Ошибка регистрации: ' + (errorData.message || 'Неизвестная ошибка'));
                    }
                }
            } catch (error) {
                alert('Ошибка сети: ' + error.message);
            }
        });
    }

    // Обработчик для входа
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch(`${BASE_URL}/api/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                if (!response.ok) {
                    throw new Error('Ошибка входа');
                }

                const data = await response.json();
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    window.location.href = 'profile.html';
                } else {
                    alert('Ошибка входа: Неверный логин или пароль');
                }
            } catch (error) {
                alert(error.message);
            }
        });
    }

    // Обработчик для добавления задач
    const taskForm = document.getElementById('taskForm');
    if (taskForm) {
        taskForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            const title = document.getElementById('title').value;
            const content = document.getElementById('content').value;

            try {
                const response = await fetch(`${BASE_URL}/api/tasks`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: JSON.stringify({ title, content }),
                });

                if (response.ok) {
                    loadTasks();
                } else {
                    alert('Ошибка добавления задачи');
                }
            } catch (error) {
                alert('Ошибка сети: ' + error.message);
            }
        });

        loadTasks();
    }

    // Обработчик для удаления задач
    const taskList = document.getElementById('taskList');
    if (taskList) {
        taskList.addEventListener('click', async function (event) {
            if (event.target.classList.contains('delete-task')) {
                const taskId = event.target.dataset.taskId;

                // Проверяем, что taskId существует и является числом
                if (!taskId || isNaN(taskId)) {
                    alert('Ошибка: Некорректный ID задачи');
                    return;
                }

                try {
                    const response = await fetch(`${BASE_URL}/api/tasks/${taskId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        },
                    });

                    if (response.ok) {
                        loadTasks(); // Перезагружаем список задач
                    } else {
                        alert('Ошибка удаления задачи');
                    }
                } catch (error) {
                    alert('Ошибка сети: ' + error.message);
                }
            }
        });
    }

    // Обработчик для выхода
    const logoutButton = document.getElementById('logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', function (event) {
            event.preventDefault();
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        });
    }

    // Загрузка задач
    async function loadTasks() {
        try {
            const response = await fetch(`${BASE_URL}/api/tasks`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            const tasks = await response.json();
            console.log(tasks); // Логируем задачи для отладки

            const taskList = document.getElementById('taskList');
            taskList.innerHTML = '';
            tasks.forEach(task => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <strong>${task.title}</strong>: ${task.content}
                    <br>
                    <small>Создано: ${formatDateTime(task.createdAt)}</small>
                    <button class="delete-task" data-task-id="${task.id}">Удалить</button>
                `;
                taskList.appendChild(li);
                fadeIn(li);
            });
        } catch (error) {
            alert('Ошибка загрузки задач: ' + error.message);
        }
    }

    // Загрузка данных профиля
    const profileUsername = document.getElementById('profileUsername');
    const profileEmail = document.getElementById('profileEmail');
    const profileCreatedAt = document.getElementById('profileCreatedAt'); // Добавляем элемент для даты создания

    if (profileUsername && profileEmail && profileCreatedAt) {
        async function loadProfile() {
            try {
                const response = await fetch(`${BASE_URL}/api/users/me`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                });

                if (response.ok) {
                    const user = await response.json();
                    profileUsername.textContent = user.username;
                    profileEmail.textContent = user.email;
                    profileCreatedAt.textContent = `Аккаунт создан: ${formatDateTime(user.createdAt)}`; // Форматируем дату
                } else {
                    alert('Ошибка загрузки профиля');
                }
            } catch (error) {
                alert('Ошибка сети: ' + error.message);
            }
        }
        loadProfile();
    }

    // Анимация появления
    function fadeIn(element, duration = 500) {
        element.style.opacity = 0;
        element.style.display = 'block';
        let start = null;
        function step(timestamp) {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            element.style.opacity = Math.min(progress / duration, 1);
            if (progress < duration) {
                window.requestAnimationFrame(step);
            }
        }
        window.requestAnimationFrame(step);
    }

    // Анимация появления для всех элементов с классом .fade-in
    document.querySelectorAll('.fade-in').forEach(element => {
        fadeIn(element);
    });
});