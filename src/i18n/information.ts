import type { Locale } from './dictionaries';
type Info = { title: string; text: string[] };
const en: Record<string, Info> = {
  about: {
    title: 'Move your own way.',
    text: [
      'KIXO is a sneaker store concept from Tashkent, bringing streetwear culture, clean design, and effortless shopping together.',
      'This is a working demonstration. Products and prices are sample data; orders are not sent to a courier. We do not publish invented customer reviews.',
    ],
  },
  delivery: {
    title: 'Delivery & payment',
    text: [
      'Sample delivery terms: 1–2 days in Tashkent, 2–5 days to other regions after confirmation.',
      'Delivery costs 30,000 UZS, or is free on orders of 1,500,000 UZS or more after discounts.',
      'Cash on delivery is available. Click and Payme are disabled until merchant credentials and verified official API adapters are configured. No online payment is charged.',
    ],
  },
  returns: {
    title: 'Exchanges & returns',
    text: [
      'Returns are available within 14 days if shoes remain unworn and in their original packaging and condition.',
      'Contact the store with your order number. Before real sales begin, the owner must align these terms with local regulations and store operations.',
    ],
  },
  privacy: {
    title: 'Privacy',
    text: [
      'Order processing stores your name, phone, address, and purchased items. Passwords are securely hashed. Card details are never collected.',
      'Cookies support sign-in, language selection, and access to guest orders. Your bag and wishlist are saved in your browser.',
      'Newsletter emails are saved in the database; automatic email delivery is not connected. Ask the administrator to delete your data. Legal details and contact information must be completed before real sales.',
    ],
  },
  sizes: {
    title: 'Find your fit',
    text: [
      'Measure your foot from heel to the longest toe in the evening, wearing the socks you plan to use.',
      'Approximate guide: EU 38 — 24 cm; 39 — 24.5 cm; 40 — 25 cm; 41 — 26 cm; 42 — 26.5 cm; 43 — 27.5 cm; 44 — 28 cm; 45 — 29 cm.',
      'Brand size charts vary. Confirm the specific model’s insole length before purchasing. Unavailable sizes cannot be added to your bag.',
    ],
  },
  contact: {
    title: 'Let’s talk.',
    text: [
      'Tashkent, Uzbekistan.',
      'Store contact details have not been configured. The administrator can add an email and phone in store settings.',
      'Sign in to see your orders. Guest orders can be viewed in the same browser on their confirmation page for 30 days.',
    ],
  },
};
const uz: Record<string, Info> = {
  about: {
    title: 'O‘z yo‘lingdan bor.',
    text: [
      'KIXO — Toshkentdagi krossovka do‘koni konsepsiyasi. Streetwear madaniyati, sodda dizayn va qulay xaridlar bir joyda.',
      'Bu ishlaydigan demo loyiha. Mahsulotlar va narxlar namunaviy, buyurtmalar kuryerga yuborilmaydi. Soxta xaridor fikrlari joylanmaydi.',
    ],
  },
  delivery: {
    title: 'Yetkazish va to‘lov',
    text: [
      'Namunaviy shartlar: tasdiqlangandan keyin Toshkentda 1–2 kun, viloyatlarda 2–5 kun.',
      'Yetkazish 30 000 UZS. Chegirmadan keyingi summa 1 500 000 UZS yoki undan ko‘p bo‘lsa — bepul.',
      'Yetkazilganda naqd to‘lash mumkin. Click va Payme savdogar rekvizitlari va rasmiy API adapterlari sozlanmaguncha o‘chirilgan. Onlayn mablag‘ yechilmaydi.',
    ],
  },
  returns: {
    title: 'Almashtirish va qaytarish',
    text: [
      'Oyoq kiyim kiyilmagan, asl qadoq va tovar ko‘rinishi saqlangan bo‘lsa, 14 kun ichida qaytarish mumkin.',
      'Do‘konga buyurtma raqami bilan murojaat qiling. Haqiqiy savdodan oldin egasi shartlarni mahalliy qonunchilik va do‘kon jarayonlariga moslashtirishi kerak.',
    ],
  },
  privacy: {
    title: 'Maxfiylik',
    text: [
      'Buyurtma uchun ism, telefon, manzil va mahsulotlar saqlanadi. Parollar xavfsiz xeshlangan. Bank karta ma’lumotlari yig‘ilmaydi.',
      'Cookie kirish, til tanlash va mehmon buyurtmalariga kirish uchun ishlatiladi. Savat va sevimlilar brauzerda saqlanadi.',
      'Obuna emaillari bazada saqlanadi, avtomatik xat yuborish ulanmagan. Ma’lumotlarni o‘chirish uchun administratorga murojaat qiling. Haqiqiy savdodan oldin huquqiy va aloqa ma’lumotlari to‘ldirilishi kerak.',
    ],
  },
  sizes: {
    title: 'O‘z o‘lchamingizni toping',
    text: [
      'Kechqurun, kiyishni rejalashtirgan paypoq bilan oyoqni tovondan eng uzun barmoqqacha o‘lchang.',
      'Taxminiy jadval: EU 38 — 24 sm; 39 — 24,5 sm; 40 — 25 sm; 41 — 26 sm; 42 — 26,5 sm; 43 — 27,5 sm; 44 — 28 sm; 45 — 29 sm.',
      'Brendlarning o‘lcham jadvallari farq qiladi. Xariddan oldin aniq modelning taglik uzunligini tekshiring. Mavjud bo‘lmagan o‘lchamni savatga qo‘shib bo‘lmaydi.',
    ],
  },
  contact: {
    title: 'Aloqadamiz.',
    text: [
      'Toshkent, O‘zbekiston.',
      'Haqiqiy do‘konning aloqa ma’lumotlari hali kiritilmagan. Administrator sozlamalarda email va telefon qo‘shishi mumkin.',
      'Buyurtmalaringizni ko‘rish uchun profilingizga kiring. Mehmon buyurtmalari shu brauzerda tasdiqlash sahifasi orqali 30 kun ko‘rinadi.',
    ],
  },
};
export function information(locale: Locale, fallback: Record<string, Info>) {
  return locale === 'en' ? en : locale === 'uz' ? uz : fallback;
}
