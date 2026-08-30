export async function onRequest(context) {
    const { request, env } = context;

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({
            success: false,
            error: 'Method not allowed'
        }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const data = await request.json();
        const { name, phone, email } = data;

        // Отправка в Telegram
        const token = env.TELEGRAM_BOT_TOKEN;
        const chatId = env.TELEGRAM_CHAT_ID;

        if (token && chatId) {
            const message =
                `📩 **Новая заявка с сайта**\n\n` +
                `👤 **Имя:** ${name}\n` +
                `📱 **Телефон:** ${phone}\n` +
                `📧 **Email:** ${email || 'Не указан'}`;

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

        // Отправка на Formspree
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

        return new Response(JSON.stringify({
            success: true,
            message: 'Заявка успешно отправлена!'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Внутренняя ошибка сервера'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}