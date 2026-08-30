// ============================================================
// TELEGRAM БОТ ДЛЯ AI ASSISTANT
// Версия: 2.0
// Запуск: node bot.js
// ============================================================

const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// ============================================================
// 1. КОНФИГУРАЦИЯ
// ============================================================
// Токен берется из переменных окружения (безопасно!)
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TOKEN) {
    console.error('❌ ОШИБКА: TELEGRAM_BOT_TOKEN не найден в .env файле!');
    console.error('📝 Создай файл .env и добавь: TELEGRAM_BOT_TOKEN=твой_токен');
    process.exit(1);
}

// Создаем экземпляр бота с включенным polling
const bot = new TelegramBot(TOKEN, {
    polling: true,
    // Опционально: настройки для больших нагрузок
    // polling: { timeout: 30 }
});

console.log('🤖 Бот запущен и слушает команды...');
console.log(`📌 Имя бота: @${bot.options.username || 'неизвестно'}`);

// ============================================================
// 2. КОМАНДА /start — ПРИВЕТСТВИЕ ПОСЛЕ РЕГИСТРАЦИИ
// ============================================================
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || 'пользователь';
    const username = msg.from.username ? `@${msg.from.username}` : '';

    // Формируем персонализированное приветствие
    const greeting = `🌟 Добро пожаловать в AI Assistant, ${firstName}! 🎉

Спасибо за регистрацию на нашем сайте! 
Ваша заявка принята, и наш AI-эксперт уже анализирует ваш бизнес.

📩 В ближайшее время вы получите персональные рекомендации.

А пока вы можете:
• Задать любой вопрос AI-ассистенту
• Узнать больше о наших решениях
• Получить бесплатный демо-доступ

Спасибо, что выбрали нас! 🚀`;

    // Отправляем приветствие с кнопками
    bot.sendMessage(chatId, greeting, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '💬 Задать вопрос', callback_data: 'ask_question' },
                    { text: '📊 О сервисе', callback_data: 'about' }
                ],
                [
                    { text: '🌐 Перейти на сайт', url: 'https://testsite.smart-flow.workers.dev/' }
                ]
            ]
        }
    });

    // Лог для отладки
    console.log(`✅ Приветствие отправлено пользователю ${firstName} (${username || chatId})`);
});

// ============================================================
// 3. ОБРАБОТКА INLINE КНОПОК
// ============================================================
bot.on('callback_query', (callbackQuery) => {
    const message = callbackQuery.message;
    const chatId = message.chat.id;
    const data = callbackQuery.data;
    const firstName = callbackQuery.from.first_name || 'пользователь';

    // Отвечаем на нажатие кнопки (убираем "часики")
    bot.answerCallbackQuery(callbackQuery.id);

    switch (data) {
        case 'ask_question':
            bot.sendMessage(
                chatId,
                `💬 *Задайте ваш вопрос AI-ассистенту, ${firstName}!*

Напишите ваш вопрос в следующем сообщении, и я постараюсь помочь!

Если вопрос сложный — наш специалист свяжется с вами в ближайшее время.`,
                { parse_mode: 'Markdown' }
            );
            break;

        case 'about':
            bot.sendMessage(
                chatId,
                `📊 *О сервисе AI Assistant*

Мы помогаем бизнесу автоматизировать рутину, анализировать данные и принимать правильные решения.

🔹 *10 000+* активных пользователей
🔹 *99.9%* точность анализа
🔹 *24/7* поддержка AI

Хотите узнать больше? Переходите на наш сайт!`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '🌐 Перейти на сайт', url: 'https://testsite.smart-flow.workers.dev/' }
                            ]
                        ]
                    }
                }
            );
            break;

        default:
            bot.sendMessage(chatId, '⚠️ Неизвестная команда. Попробуйте /start');
    }

    console.log(`🔄 Обработана кнопка "${data}" для пользователя ${firstName}`);
});

// ============================================================
// 4. ОБРАБОТКА ТЕКСТОВЫХ СООБЩЕНИЙ (НЕ КОМАНД)
// ============================================================
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const firstName = msg.from.first_name || 'пользователь';

    // Игнорируем команды (они уже обработаны выше)
    if (text && text.startsWith('/')) {
        return;
    }

    // Игнорируем пустые сообщения
    if (!text) {
        return;
    }

    // Проверяем, не является ли это ответом на вопрос
    // (простая эвристика: если сообщение длинное или содержит вопросительный знак)
    const isQuestion = text.length > 20 || text.includes('?') || text.includes('?');

    if (isQuestion) {
        bot.sendMessage(
            chatId,
            `✅ *Спасибо за ваш вопрос, ${firstName}!*

Я передал его нашему AI-ассистенту. Обычно ответ приходит в течение нескольких минут.

А пока можете посмотреть информацию о сервисе:`,
            {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '📊 О сервисе', callback_data: 'about' },
                            { text: '🌐 На сайт', url: 'https://testsite.smart-flow.workers.dev/' }
                        ]
                    ]
                }
            }
        );
    } else {
        // Короткое сообщение — просто отвечаем
        bot.sendMessage(
            chatId,
            `👋 Привет, ${firstName}! 

Я AI-ассистент. Если у вас есть вопрос — просто напишите его, и я помогу!

Или воспользуйтесь кнопкой "Задать вопрос" ниже.`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '💬 Задать вопрос', callback_data: 'ask_question' },
                            { text: '📊 О сервисе', callback_data: 'about' }
                        ]
                    ]
                }
            }
        );
    }

    console.log(`💬 Получено сообщение от ${firstName}: "${text.substring(0, 50)}..."`);
});

// ============================================================
// 5. ОБРАБОТКА ОШИБОК
// ============================================================
bot.on('polling_error', (error) => {
    console.error('❌ Ошибка polling:', error.message);
    if (error.message.includes('ETIMEDOUT')) {
        console.log('🔄 Переподключение...');
    }
});

bot.on('error', (error) => {
    console.error('❌ Ошибка бота:', error.message);
});

// ============================================================
// 6. ОБРАБОТКА ЗАВЕРШЕНИЯ ПРОЦЕССА
// ============================================================
process.on('SIGINT', () => {
    console.log('\n🛑 Бот остановлен (Ctrl+C)');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Бот остановлен (SIGTERM)');
    process.exit(0);
});

// ============================================================
// 7. ИНФОРМАЦИЯ ПРИ ЗАПУСКЕ
// ============================================================
console.log(`
✅ Бот успешно запущен!
📌 Команды: /start - приветствие
📌 Статус: Ожидание сообщений...

Нажмите Ctrl+C для остановки
`);