// ============================================================
// _worker.js — Cloudflare Worker для обработки заявок
// ============================================================

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // ============================================================
        // 1. ОБРАБОТКА POST /api/submit
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

                // ===== ОТПРАВКА В TELEGRAM =====
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

                // ===== ОТПРАВКА НА ПОЧТУ (Formspree) =====
                const formspreeId = env.FORMSPREE_ID || 'ваш-id-формы';
                await fetch(`https://formspree.io/f/${formspreeId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: name,
                        phone: phone,
                        email: email || '',
                        _subject: `Новая заявка с сайта *ссылка на сайт*`,
                        _gotcha: ''
                    })
                });

                // ===== УСПЕШНЫЙ ОТВЕТ =====
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
        // 2. ВСЕ ОСТАЛЬНЫЕ ЗАПРОСЫ — СТАТИКА
        // ============================================================
        return env.ASSETS.fetch(request);
    }
};