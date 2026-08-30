// ============================================================
// 1. DOM ЭЛЕМЕНТЫ
// ============================================================
const form = document.getElementById('contactForm');
const nameInput = document.getElementById('name');
const phoneInput = document.getElementById('phone');
const emailInput = document.getElementById('email');
const nameError = document.getElementById('nameError');
const phoneError = document.getElementById('phoneError');
const submitBtn = document.querySelector('.btn-submit');
const submitText = document.getElementById('submitText');
const submitSpinner = document.getElementById('submitSpinner');

// ============================================================
// 2. МАСКА ТЕЛЕФОНА
// ============================================================
phoneInput.addEventListener('input', function (e) {
    let value = this.value.replace(/\D/g, '');

    if (value.length > 0) {
        // Убираем 7 или 8 в начале, если есть
        if (value.startsWith('7') || value.startsWith('8')) {
            value = value.slice(1);
        }

        let formatted = '+7 ';

        if (value.length > 0) {
            formatted += '(' + value.slice(0, 3);
        }
        if (value.length > 3) {
            formatted += ') ' + value.slice(3, 6);
        }
        if (value.length > 6) {
            formatted += '-' + value.slice(6, 8);
        }
        if (value.length > 8) {
            formatted += '-' + value.slice(8, 10);
        }

        this.value = formatted;
    } else {
        this.value = '';
    }
});

// ============================================================
// 3. ВАЛИДАЦИЯ
// ============================================================
function validateName(name) {
    return name.trim().length >= 2;
}

function validatePhone(phone) {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 11; // +7XXXXXXXXXX = 11 цифр
}

function validateEmail(email) {
    if (!email) return true; // Поле опционально
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// ============================================================
// 4. ПОКАЗ/СКРЫТИЕ ОШИБОК
// ============================================================
function showError(input, errorEl) {
    input.classList.add('error');
    errorEl.classList.add('visible');
}

function hideError(input, errorEl) {
    input.classList.remove('error');
    errorEl.classList.remove('visible');
}

// ============================================================
// 5. ВАЛИДАЦИЯ ПРИ ПОТЕРЕ ФОКУСА (blur)
// ============================================================
nameInput.addEventListener('blur', function () {
    if (!validateName(this.value)) {
        showError(this, nameError);
    } else {
        hideError(this, nameError);
    }
});

phoneInput.addEventListener('blur', function () {
    if (!validatePhone(this.value)) {
        showError(this, phoneError);
    } else {
        hideError(this, phoneError);
    }
});

// ============================================================
// 6. СКРЫВАЕМ ОШИБКИ ПРИ ВВОДЕ (input)
// ============================================================
nameInput.addEventListener('input', function () {
    if (validateName(this.value)) {
        hideError(this, nameError);
    }
});

phoneInput.addEventListener('input', function () {
    if (validatePhone(this.value)) {
        hideError(this, phoneError);
    }
});

// ============================================================
// 7. ОТПРАВКА ФОРМЫ
// ============================================================
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // --- 7.1. Финальная валидация ---
    const isNameValid = validateName(nameInput.value);
    const isPhoneValid = validatePhone(phoneInput.value);

    if (!isNameValid) {
        showError(nameInput, nameError);
        nameInput.focus();
        return;
    }

    if (!isPhoneValid) {
        showError(phoneInput, phoneError);
        phoneInput.focus();
        return;
    }

    // --- 7.2. Блокируем кнопку ---
    submitBtn.disabled = true;
    submitText.textContent = 'Отправка...';
    submitSpinner.classList.remove('hidden');

    // --- 7.3. Собираем данные ---
    const formData = {
        name: nameInput.value.trim(),
        phone: phoneInput.value.trim(),
        email: emailInput.value.trim() || ''
    };

    try {
        // --- 7.4. Отправка на отдельный Worker ---
        // ✅ ПРАВИЛЬНЫЙ URL с /api/submit
        const response = await fetch('https://testsite-api.smart-flow.workers.dev/api/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        // --- 7.5. Проверка ответа ---
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Ошибка сервера:', response.status, errorText);
            throw new Error(`Сервер вернул ошибку ${response.status}`);
        }

        const result = await response.json();

        // --- 7.6. Обработка результата ---
        if (result.success) {
            // ✅ Успех — перенаправляем в Telegram
            window.location.href = 'https://t.me/AIMasterBot';
        } else {
            // ❌ Ошибка от сервера
            alert('❌ Ошибка: ' + (result.error || 'Неизвестная ошибка'));
        }
    } catch (error) {
        // ❌ Сетевая ошибка
        console.error('❌ Ошибка отправки:', error);
        alert('❌ Не удалось отправить заявку. Проверьте интернет-соединение и попробуйте снова.');
    } finally {
        // --- 7.7. Разблокируем кнопку ---
        submitBtn.disabled = false;
        submitText.textContent = 'Отправить заявку';
        submitSpinner.classList.add('hidden');
    }
});

// ============================================================
// 8. ОБРАБОТКА КЛАВИШИ ENTER В ПОЛЯХ
// ============================================================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
        const inputs = ['name', 'phone', 'email'];
        const currentIndex = inputs.indexOf(e.target.id);

        if (currentIndex !== -1 && currentIndex < inputs.length - 1) {
            // Переход к следующему полю
            const nextInput = document.getElementById(inputs[currentIndex + 1]);
            if (nextInput) {
                e.preventDefault();
                nextInput.focus();
            }
        }
    }
});

// ============================================================
// 9. ПЛАВНЫЙ СКРОЛЛ К ФОРМЕ (для кнопок "Начать")
// ============================================================
document.querySelectorAll('a[href="#form"]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const formSection = document.getElementById('form');
        if (formSection) {
            formSection.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// ============================================================
// 10. АНИМАЦИЯ ПОЯВЛЕНИЯ ЭЛЕМЕНТОВ ПРИ СКРОЛЛЕ
// ============================================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.fade-in').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    observer.observe(el);
});

console.log('🚀 AI Assistant лендинг загружен!');
console.log('📌 Отправка на: https://testsite-api.smart-flow.workers.dev/api/submit');