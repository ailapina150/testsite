// ============================================================
// _worker.js — Cloudflare Worker с отправкой через Resend
// ============================================================

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // ============================================================
        // ОБРАБОТКА POST /api/submit
        // ============================================================
        if (request.method === 'POST' && url.pathname === '/api/submit') {
            try {
                const data = await request.json();
                const { name, phone, email } = data;

                // Валидация
                if (!name || name.trim().length < 2) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Имя должно содержать минимум 2 символа'
                    }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                if (!phone || phone.replace(/\D/g, '').length < 11) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Некорректный номер телефона'
                    }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // ============================================================
                // 1. ОТПРАВКА НА ПОЧТУ ЧЕРЕЗ RESEND
                // ============================================================
                const RESEND_API_KEY = env.RESEND_API_KEY;
                const siteUrl = 'https://testsite.pages.dev';

                if (!RESEND_API_KEY) {
                    console.error('❌ RESEND_API_KEY не настроен');
                } else {
                    // Формируем HTML-письмо для красивого отображения
                    const htmlContent = `
                        <h2>Новая заявка с сайта</h2>
                        <p><strong>Сайт:</strong> <a href="${siteUrl}">${siteUrl}</a></p>
                        <p><strong>Автор:</strong> Анна Лапина</p>
                        <hr>
                        <p><strong>Имя:</strong> ${name}</p>
                        <p><strong>Телефон:</strong> ${phone}</p>
                        <p><strong>Email:</strong> ${email || 'Не указан'}</p>
                        <hr>
                        <p style="color: #666; font-size: 12px;">Отправлено через Resend</p>
                    `;

                    const textContent = `
                        Новая заявка с сайта ${siteUrl}
                        Автор: Анна Лапина
                        ---
                        Имя: ${name}
                        Телефон: ${phone}
                        Email: ${email || 'Не указан'}
                    `;

                    const response = await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${RESEND_API_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            from: 'onboarding@resend.dev',  // Бесплатный отправитель
                            to: ['superhumansmm@yandex.ru'], // ← ЛЮБОЙ EMAIL
                            subject: `Новая заявка с сайта ${siteUrl}`,
                            html: htmlContent,
                            text: textContent,
                            reply_to: email || undefined
                        })
                    });

                    const result = await response.json();

                    if (!response.ok) {
                        console.error('❌ Resend ошибка:', result);
                    } else {
                        console.log('✅ Письмо отправлено через Resend:', result.id);
                    }
                }

                // ============================================================
                // 2. ОТПРАВКА В TELEGRAM (опционально, если есть токен)
                // ============================================================
                const token = env.TELEGRAM_BOT_TOKEN;
                const chatId = env.TELEGRAM_CHAT_ID;

                if (token && chatId) {
                    const message =
                        `📩 **Новая заявка с сайта**\n\n` +
                        `👤 **Имя:** ${name}\n` +
                        `📱 **Телефон:** ${phone}\n` +
                        `📧 **Email:** ${email || 'Не указан'}\n\n` +
                        `🕐 ${new Date().toLocaleString('ru-RU')}`;

                    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chat_id: chatId,
                            text: message,
                            parse_mode: 'Markdown'
                        })
                    });
                }

                // ============================================================
                // УСПЕШНЫЙ ОТВЕТ
                // ============================================================
                return new Response(JSON.stringify({
                    success: true,
                    message: 'Заявка успешно отправлена!'
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });

            } catch (error) {
                console.error('❌ Ошибка:', error);
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Внутренняя ошибка сервера'
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // ============================================================
        // ВСЕ ОСТАЛЬНЫЕ ЗАПРОСЫ — СТАТИКА
        // ============================================================
        return env.ASSETS.fetch(request);
    }
};