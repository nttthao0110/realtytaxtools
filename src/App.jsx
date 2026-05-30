import { useState, useEffect } from "react";

// ── THEME ────────────────────────────────────────────────────────────────────
const T = {
  bg:"#07080a", bgCard:"#0d0f12", bgCard2:"#0a0c0e", bgCardHover:"#12151a",
  border:"#1c2028", borderHover:"#2a3040",
  gold:"#c8a96e", goldLight:"#e8c98e", goldDim:"#7a6540",
  text:"#e8e4dc", textMid:"#8a8478", textDim:"#3a3830",
  green:"#4a9060", greenBg:"#0a1a0e",
  red:"#c07050", redBg:"#1a0e0a",
  accent:"#4a6fa8", accentBg:"#0a1020",
  purple:"#8040b0", purpleBg:"#0a0818",
  amber:"#c8893e", white:"#e8e4dc",
};

// ── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = (v) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(v||0);
const fmtD = (v) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(v||0);
const parse = (s) => parseFloat(String(s||"").replace(/[^0-9.]/g,""))||0;
const pct = (v) => `${(v*100).toFixed(1)}%`;

// ── TAX MATH ─────────────────────────────────────────────────────────────────
const IRS_RATE=0.07, AI_FACTORS=[4,2.4,1.5,1], AI_PCT=[0.225,0.45,0.675,0.90];
const BRACKETS={
  single:[[11600,.10],[47150,.12],[100525,.22],[191950,.24],[243725,.32],[609350,.35],[Infinity,.37]],
  mfj:   [[23200,.10],[94300,.12],[201050,.22],[383900,.24],[487450,.32],[731200,.35],[Infinity,.37]],
  mfs:   [[11600,.10],[47150,.12],[100525,.22],[191950,.24],[243725,.32],[365600,.35],[Infinity,.37]],
  hoh:   [[16550,.10],[63100,.12],[100500,.22],[191950,.24],[243700,.32],[609350,.35],[Infinity,.37]],
};
const STD_DED={single:14600,mfj:29200,mfs:14600,hoh:21900};
const CG_BRACKETS={
  single:[[47025,0],[518900,.15],[Infinity,.20]],
  mfj:   [[94050,0],[583750,.15],[Infinity,.20]],
  mfs:   [[47025,0],[291850,.15],[Infinity,.20]],
  hoh:   [[63000,0],[551350,.15],[Infinity,.20]],
};
function estTax(gross,status){
  const taxable=Math.max(0,gross-(STD_DED[status]||14600));
  const b=BRACKETS[status]||BRACKETS.single;
  let tax=0,prev=0;
  for(const [cap,rate] of b){if(taxable<=prev)break;tax+=(Math.min(taxable,cap)-prev)*rate;prev=cap;}
  return Math.round(tax);
}
function cgTax(gain,status){
  const b=CG_BRACKETS[status]||CG_BRACKETS.single;
  let tax=0,prev=0;
  for(const [cap,rate] of b){if(gain<=prev)break;tax+=(Math.min(gain,cap)-prev)*rate;prev=cap;}
  return Math.round(tax);
}
function getThreshold(fs){return fs==="mfs"?75000:150000;}

// ── i18n ──────────────────────────────────────────────────────────────────────
const LANG={
  en:{
    code:"EN",
    nav:{home:"Home",calculators:"Calculators",blog:"Blog",shop:"Shop",about:"About"},
    hero:{
      eyebrow:"Real Estate Tax Tools · Built by a CPA",
      h1a:"Stop Overpaying.", h1b:"Start Calculating.",
      sub:"Free professional-grade tax calculators built by a real estate CPA. Know exactly what you owe — before the IRS tells you.",
      cta:"Explore Free Tools", cta2:"Browse the Shop",
    },
    trust:["Licensed CPA","Real estate specialist","Free forever"],
    calcHub:{title:"Free Tax Calculators",sub:"Professional tools for investors, landlords & agents"},
    blog:{title:"Tax Education",sub:"Plain-language real estate tax strategy",readMore:"Read →"},
    shop:{title:"Resources & Templates",sub:"CPA-built tools you can use today",buy:"Get it →"},
    about:{
      title:"About", sub:"Your real estate tax specialist",
      h1:"Hi, I'm a CPA Specializing in Real Estate Tax.",
      bio1:"With years of experience working exclusively with real estate investors, landlords, and agents, I built this site because I kept seeing the same problems: investors overpaying taxes, agents missing deductions, and landlords getting blindsided by IRS penalties.",
      bio2:"I own rental properties myself and my husband is a real estate agent — so this isn't just academic. These tools are built from real-world experience with the exact situations you face.",
      bio3:"Everything on this site is free to use. The calculators are built to professional standards. The guides are written in plain language. My goal is simple: help you keep more of what you earn.",
      credentials:"Credentials & Background",
      cred1:"Licensed CPA", cred2:"Real estate tax specialist",
      cred3:"Rental property owner", cred4:"Bilingual (English & Vietnamese)",
      contact:"Have a question?",
      contactSub:"Use the contact form below.",
    },
    contact:{
      title:"Contact", sub:"Get in touch",
      nameL:"Your name", emailL:"Email address",
      subjectL:"Subject", msgL:"Message",
      send:"Send Message", sent:"Message sent! I'll be in touch within 2 business days.",
      subjects:["General question","Tax question","Product support","Other"],
    },
    footer:{
      disclaimer:"For informational purposes only. Not tax advice. Consult a licensed tax professional.",
      rights:"All rights reserved.",
    },
  },
  vi:{
    code:"VI",
    nav:{home:"Trang Chủ",calculators:"Công Cụ",blog:"Bài Viết",shop:"Tài Liệu",about:"Giới Thiệu"},
    hero:{
      eyebrow:"Công Cụ Thuế Bất Động Sản · Được Tạo Bởi CPA",
      h1a:"Ngừng Nộp Thừa.", h1b:"Bắt Đầu Tính Toán.",
      sub:"Công cụ tính thuế miễn phí được xây dựng bởi CPA chuyên bất động sản. Biết chính xác bạn phải nộp — trước khi IRS thông báo.",
      cta:"Xem Công Cụ Miễn Phí", cta2:"Xem Tài Liệu",
    },
    trust:["CPA có chứng chỉ","Chuyên gia bất động sản","Miễn phí mãi mãi"],
    calcHub:{title:"Công Cụ Tính Thuế Miễn Phí",sub:"Công cụ chuyên nghiệp cho nhà đầu tư, chủ nhà và môi giới"},
    blog:{title:"Kiến Thức Thuế",sub:"Hướng dẫn đơn giản về thuế bất động sản",readMore:"Đọc →"},
    shop:{title:"Tài Liệu & Mẫu Biểu",sub:"Công cụ do CPA tạo ra, dùng được ngay",buy:"Mua ngay →"},
    about:{
      title:"Giới Thiệu", sub:"Chuyên gia thuế bất động sản của bạn",
      h1:"Xin chào, tôi là CPA chuyên về thuế bất động sản.",
      bio1:"Với nhiều năm kinh nghiệm làm việc với các nhà đầu tư, chủ nhà cho thuê và môi giới bất động sản, tôi xây dựng trang web này vì tôi liên tục thấy những vấn đề giống nhau: nhà đầu tư nộp thừa thuế, môi giới bỏ sót khấu trừ, và chủ nhà bị IRS phạt bất ngờ.",
      bio2:"Tôi sở hữu bất động sản cho thuê và chồng tôi là môi giới bất động sản — vì vậy đây không chỉ là lý thuyết. Các công cụ này được xây dựng từ kinh nghiệm thực tế.",
      bio3:"Tất cả mọi thứ trên trang này đều miễn phí sử dụng. Mục tiêu của tôi đơn giản: giúp bạn giữ lại nhiều hơn những gì bạn kiếm được.",
      credentials:"Chứng Chỉ & Kinh Nghiệm",
      cred1:"CPA có chứng chỉ", cred2:"Chuyên gia thuế bất động sản",
      cred3:"Chủ sở hữu bất động sản cho thuê", cred4:"Song ngữ (Tiếng Anh & Tiếng Việt)",
      contact:"Có câu hỏi?", contactSub:"Sử dụng biểu mẫu liên hệ bên dưới.",
    },
    contact:{
      title:"Liên Hệ", sub:"Liên lạc với tôi",
      nameL:"Tên của bạn", emailL:"Địa chỉ email",
      subjectL:"Chủ đề", msgL:"Tin nhắn",
      send:"Gửi Tin Nhắn", sent:"Đã gửi! Tôi sẽ phản hồi trong 2 ngày làm việc.",
      subjects:["Câu hỏi chung","Câu hỏi về thuế","Hỗ trợ sản phẩm","Khác"],
    },
    footer:{
      disclaimer:"Chỉ để tham khảo. Không phải tư vấn thuế. Hãy tham khảo chuyên gia thuế.",
      rights:"Bản quyền thuộc về tác giả.",
    },
  },
  es:{
    code:"ES",
    nav:{home:"Inicio",calculators:"Calculadoras",blog:"Blog",shop:"Tienda",about:"Sobre Mí"},
    hero:{
      eyebrow:"Herramientas de Impuestos Inmobiliarios · Por una CPA",
      h1a:"Deja de Pagar de Más.", h1b:"Empieza a Calcular.",
      sub:"Calculadoras de impuestos gratuitas creadas por una CPA especializada en bienes raíces. Sepa exactamente lo que debe — antes de que el IRS se lo diga.",
      cta:"Ver Herramientas Gratuitas", cta2:"Ver la Tienda",
    },
    trust:["CPA certificada","Especialista en bienes raíces","Gratis para siempre"],
    calcHub:{title:"Calculadoras de Impuestos Gratuitas",sub:"Herramientas para inversores, propietarios y agentes"},
    blog:{title:"Educación Fiscal",sub:"Guías claras sobre estrategia fiscal inmobiliaria",readMore:"Leer →"},
    shop:{title:"Recursos y Plantillas",sub:"Herramientas creadas por CPA, úselas hoy",buy:"Obtener →"},
    about:{
      title:"Sobre Mí", sub:"Su especialista en impuestos inmobiliarios",
      h1:"Hola, soy CPA especializada en impuestos inmobiliarios.",
      bio1:"Con años de experiencia trabajando exclusivamente con inversores, propietarios y agentes inmobiliarios, creé este sitio porque seguía viendo los mismos problemas: inversores pagando impuestos de más, agentes perdiendo deducciones y propietarios sorprendidos por multas del IRS.",
      bio2:"Soy propietaria de inmuebles en alquiler y mi esposo es agente inmobiliario — así que esto no es solo teoría. Estas herramientas están construidas desde la experiencia real.",
      bio3:"Todo en este sitio es gratuito. Mi objetivo es simple: ayudarle a conservar más de lo que gana.",
      credentials:"Credenciales y Experiencia",
      cred1:"CPA certificada", cred2:"Especialista en impuestos inmobiliarios",
      cred3:"Propietaria de inmuebles en alquiler", cred4:"Bilingüe (inglés y español)",
      contact:"¿Tiene alguna pregunta?", contactSub:"Use el formulario de contacto a continuación.",
    },
    contact:{
      title:"Contacto", sub:"Póngase en contacto",
      nameL:"Su nombre", emailL:"Correo electrónico",
      subjectL:"Asunto", msgL:"Mensaje",
      send:"Enviar Mensaje", sent:"¡Enviado! Me pondré en contacto en 2 días hábiles.",
      subjects:["Pregunta general","Pregunta fiscal","Soporte de producto","Otro"],
    },
    footer:{
      disclaimer:"Solo con fines informativos. No es asesoramiento fiscal. Consulte a un profesional.",
      rights:"Todos los derechos reservados.",
    },
  },
};

// ── BLOG POSTS ───────────────────────────────────────────────────────────────
const BLOG_POSTS=[
  {icon:"⚖️",date:"2024",
   title:{en:"What Is the IRS Underpayment Penalty?",vi:"Tiền Phạt Thiếu Thuế IRS Là Gì?",es:"¿Qué Es la Multa del IRS por Pago Insuficiente?"},
   excerpt:{en:"Most 1099 workers and real estate investors face this penalty without knowing it exists. Here's how it works and how to avoid it with the safe harbor rule.",vi:"Hầu hết người làm việc 1099 và nhà đầu tư bất động sản bị phạt mà không biết. Đây là cách hoạt động và cách tránh với quy tắc an toàn.",es:"La mayoría de los trabajadores 1099 e inversores inmobiliarios enfrentan esta multa sin saberlo. Así funciona y cómo evitarla con la regla de puerto seguro."},
   content:{
     en:`The IRS underpayment penalty applies when you don't pay enough tax throughout the year. For most people, taxes are withheld from a paycheck automatically. But if you're self-employed, a landlord, or a real estate investor, you're responsible for making estimated tax payments every quarter.\n\nThe penalty kicks in when your total payments fall short of a "safe harbor" threshold. There are two safe harbor rules:\n\n**90% rule:** Pay at least 90% of your current year's tax liability.\n\n**100/110% rule:** Pay 100% of last year's tax (or 110% if your prior year AGI exceeded $150,000).\n\nYou only need to meet ONE of these thresholds to avoid the penalty. The IRS uses whichever is lower.\n\nThe penalty rate changes quarterly — currently around 7% annually — and is calculated on each quarter's shortfall separately. That means even if you pay the full amount by year-end, you can still owe a penalty for early quarters.\n\n**How to avoid it:** Use our free underpayment penalty calculator above to see exactly where you stand. Then set up automatic quarterly payments at IRS Direct Pay.`,
     vi:`Phạt thiếu thuế IRS áp dụng khi bạn không nộp đủ thuế trong suốt năm. Đối với hầu hết mọi người, thuế được khấu trừ tự động từ lương. Nhưng nếu bạn tự kinh doanh, là chủ nhà cho thuê, hoặc nhà đầu tư bất động sản, bạn có trách nhiệm nộp thuế ước tính hàng quý.\n\nKhoản phạt này xảy ra khi tổng số tiền bạn nộp thấp hơn ngưỡng "an toàn". Có hai quy tắc an toàn:\n\n**Quy tắc 90%:** Nộp ít nhất 90% nghĩa vụ thuế năm hiện tại.\n\n**Quy tắc 100/110%:** Nộp 100% thuế năm ngoái (hoặc 110% nếu AGI năm trước vượt $150,000).\n\nBạn chỉ cần đáp ứng MỘT trong hai ngưỡng này để tránh bị phạt.\n\n**Cách tránh:** Sử dụng máy tính miễn phí của chúng tôi để xem chính xác tình trạng của bạn.`,
     es:`La multa del IRS por pago insuficiente se aplica cuando no paga suficientes impuestos durante el año. Para la mayoría de las personas, los impuestos se retienen automáticamente del salario. Pero si es trabajador independiente, propietario o inversor inmobiliario, usted es responsable de realizar pagos estimados cada trimestre.\n\nLa multa se activa cuando sus pagos totales caen por debajo de un umbral de "puerto seguro". Hay dos reglas de puerto seguro:\n\n**Regla del 90%:** Pague al menos el 90% de su obligación fiscal del año actual.\n\n**Regla del 100/110%:** Pague el 100% del impuesto del año pasado (o 110% si su AGI anterior superó $150,000).\n\nSolo necesita cumplir UNA de estas reglas para evitar la multa.\n\n**Cómo evitarla:** Use nuestra calculadora gratuita para ver exactamente dónde está.`,
   }},
  {icon:"🏠",date:"2024",
   title:{en:"Rental Property Depreciation: The Tax Break Most Landlords Miss",vi:"Khấu Hao Bất Động Sản: Lợi Thế Thuế Mà Nhiều Chủ Nhà Bỏ Lỡ",es:"Depreciación de Propiedad: La Ventaja Fiscal Que Muchos Propietarios Pierden"},
   excerpt:{en:"Depreciation can offset thousands in rental income every year — yet many landlords don't claim it correctly. A CPA explains exactly how residential and commercial depreciation works.",vi:"Khấu hao có thể bù đắp hàng nghìn đô thu nhập cho thuê mỗi năm — nhưng nhiều chủ nhà không khai báo đúng cách.",es:"La depreciación puede compensar miles en ingresos de alquiler cada año — sin embargo muchos propietarios no la reclaman correctamente."},
   content:{
     en:`Depreciation is one of the most powerful tax benefits available to rental property owners — and one of the most misunderstood.\n\nHere's the simple version: The IRS allows you to deduct the cost of your rental property over its "useful life." For residential rental property, that's 27.5 years. For commercial property, it's 39 years.\n\n**Example:** You buy a rental house for $300,000. The land is worth $60,000, so the depreciable basis is $240,000. Your annual depreciation deduction is $240,000 ÷ 27.5 = **$8,727 per year** — even if the property is going up in value.\n\nThis deduction reduces your taxable rental income, potentially saving you thousands every year.\n\n**Common mistakes:**\n- Not separating land value from building value\n- Using the wrong useful life\n- Forgetting to recapture depreciation when you sell\n- Missing bonus depreciation opportunities on personal property\n\nUse our Depreciation Calculator to find your exact annual deduction.`,
     vi:`Khấu hao là một trong những lợi ích thuế mạnh nhất dành cho chủ sở hữu bất động sản cho thuê — và cũng là một trong những điều bị hiểu nhầm nhất.\n\nPhiên bản đơn giản: IRS cho phép bạn khấu trừ chi phí bất động sản cho thuê theo "tuổi thọ hữu ích" của nó. Đối với bất động sản dân dụng cho thuê, đó là 27,5 năm. Đối với bất động sản thương mại, đó là 39 năm.\n\n**Ví dụ:** Bạn mua một căn nhà cho thuê với giá $300,000. Đất trị giá $60,000, vì vậy cơ sở khấu hao là $240,000. Khấu trừ khấu hao hàng năm của bạn là $240,000 ÷ 27,5 = **$8,727/năm**.\n\nKhấu trừ này làm giảm thu nhập cho thuê chịu thuế của bạn, có thể tiết kiệm cho bạn hàng nghìn đô la mỗi năm.`,
     es:`La depreciación es uno de los beneficios fiscales más poderosos disponibles para los propietarios de inmuebles en alquiler — y uno de los más mal entendidos.\n\nLa versión simple: El IRS le permite deducir el costo de su propiedad de alquiler durante su "vida útil". Para propiedades residenciales de alquiler, son 27.5 años. Para propiedades comerciales, son 39 años.\n\n**Ejemplo:** Compra una casa de alquiler por $300,000. El terreno vale $60,000, por lo que la base depreciable es $240,000. Su deducción anual de depreciación es $240,000 ÷ 27.5 = **$8,727 por año**.\n\nEsta deducción reduce sus ingresos de alquiler gravables, ahorrándole potencialmente miles cada año.`,
   }},
  {icon:"⭐",date:"2024",
   title:{en:"Real Estate Professional Status: Do You Qualify?",vi:"Trạng Thái Chuyên Nghiệp BĐS: Bạn Có Đủ Điều Kiện Không?",es:"Estado de Profesional Inmobiliario: ¿Califica Usted?"},
   excerpt:{en:"Qualifying as a real estate professional can unlock unlimited passive loss deductions — potentially saving you tens of thousands per year. Here's the 750-hour test and how to document it.",vi:"Đủ điều kiện là chuyên gia bất động sản có thể mở ra khấu trừ tổn thất thụ động không giới hạn — tiết kiệm hàng chục nghìn đô mỗi năm.",es:"Calificar como profesional inmobiliario puede desbloquear deducciones ilimitadas — potencialmente ahorrándole decenas de miles por año."},
   content:{
     en:`Rental income is normally considered "passive income," which means rental losses can only offset other passive income — not your W-2 wages or business income.\n\nBut if you qualify as a "real estate professional" under IRS rules, those losses become unlimited and can offset any income.\n\n**The two-part test:**\n1. You spend more than 750 hours per year in real estate activities\n2. More than 50% of your total working time is in real estate\n\n**What counts as real estate activities:** Development, construction, acquisition, conversion, rental, operation, management, leasing, or brokerage.\n\n**The spouse rule:** If you're married, only ONE spouse needs to qualify — but they must personally meet both requirements.\n\n**Documentation is critical:** Keep a contemporaneous time log. Courts have denied this status many times due to lack of documentation.\n\nThis is one of the most valuable elections in the tax code for the right taxpayer. Talk to a CPA before claiming it.`,
     vi:`Thu nhập cho thuê thường được coi là "thu nhập thụ động," có nghĩa là tổn thất cho thuê chỉ có thể bù đắp thu nhập thụ động khác — không phải lương W-2 hoặc thu nhập kinh doanh.\n\nNhưng nếu bạn đủ điều kiện là "chuyên gia bất động sản" theo quy định của IRS, những tổn thất đó trở nên không giới hạn và có thể bù đắp bất kỳ thu nhập nào.\n\n**Bài kiểm tra hai phần:**\n1. Bạn dành hơn 750 giờ/năm cho các hoạt động bất động sản\n2. Hơn 50% tổng thời gian làm việc của bạn là trong bất động sản\n\n**Tài liệu rất quan trọng:** Lưu nhật ký thời gian đồng thời. Nhiều trường hợp bị từ chối do thiếu tài liệu.`,
     es:`Los ingresos de alquiler normalmente se consideran "ingresos pasivos," lo que significa que las pérdidas de alquiler solo pueden compensar otros ingresos pasivos — no sus salarios W-2 ni ingresos comerciales.\n\nPero si califica como "profesional inmobiliario" bajo las reglas del IRS, esas pérdidas se vuelven ilimitadas y pueden compensar cualquier ingreso.\n\n**La prueba de dos partes:**\n1. Pasa más de 750 horas al año en actividades inmobiliarias\n2. Más del 50% de su tiempo total de trabajo está en bienes raíces\n\n**La documentación es crítica:** Mantenga un registro de tiempo contemporáneo. Los tribunales han negado este estatus muchas veces por falta de documentación.`,
   }},
];

// ── SHOP ITEMS ────────────────────────────────────────────────────────────────
const SHOP_ITEMS=[
  {icon:"📊",price:39,gumroad:"https://gumroad.com/l/YOUR-TRACKER-LINK",
   title:{en:"Rental Property Tax Tracker",vi:"Mẫu Theo Dõi Thuế Cho Thuê",es:"Rastreador de Impuestos de Alquiler"},
   desc:{en:"Google Sheets template to track income, expenses, depreciation, and quarterly payments across all your rental properties. Includes automatic totals and Schedule E prep.",vi:"Mẫu Google Sheets theo dõi thu nhập, chi phí, khấu hao và thanh toán hàng quý cho tất cả bất động sản. Bao gồm tổng tự động và chuẩn bị Schedule E.",es:"Plantilla de Google Sheets para rastrear ingresos, gastos, depreciación y pagos trimestrales. Incluye totales automáticos y preparación del Schedule E."},
   badge:{en:"Spreadsheet",vi:"Bảng tính",es:"Hoja de cálculo"}},
  {icon:"📘",price:39,gumroad:"https://gumroad.com/l/YOUR-AGENT-GUIDE-LINK",
   title:{en:"Real Estate Agent Tax Guide",vi:"Hướng Dẫn Thuế Cho Môi Giới BĐS",es:"Guía Fiscal para Agentes Inmobiliarios"},
   desc:{en:"Complete PDF guide for 1099 agents: quarterly taxes, home office, vehicle, marketing deductions, and the 10 mistakes most agents make. Written by a CPA.",vi:"Hướng dẫn PDF đầy đủ cho môi giới 1099: thuế hàng quý, văn phòng tại nhà, xe hơi, khấu trừ marketing, và 10 lỗi phổ biến nhất.",es:"Guía PDF completa para agentes 1099: impuestos trimestrales, oficina en casa, vehículo, deducciones de marketing y los 10 errores más comunes."},
   badge:{en:"PDF Guide",vi:"Hướng dẫn PDF",es:"Guía PDF"}},
  {icon:"📦",price:99,gumroad:"https://gumroad.com/l/YOUR-BUNDLE-LINK",
   title:{en:"Real Estate Investor Bundle",vi:"Gói Nhà Đầu Tư Bất Động Sản",es:"Paquete para Inversores Inmobiliarios"},
   desc:{en:"Everything: Rental tracker + Agent guide + STR tax guide + 1031 exchange checklist + Passive loss worksheet + Annual tax prep checklist. Save $30 vs buying separately.",vi:"Tất cả: Mẫu theo dõi + Hướng dẫn môi giới + Hướng dẫn thuế STR + Danh sách kiểm tra 1031 + Bảng tổn thất thụ động + Danh sách chuẩn bị thuế hàng năm. Tiết kiệm $30.",es:"Todo: Rastreador + Guía de agente + Guía STR + Lista 1031 + Hoja de pérdidas pasivas + Lista de preparación fiscal. Ahorre $30."},
   badge:{en:"Best Value",vi:"Giá trị nhất",es:"Mejor Valor"}},
];

// ── PAID CALCULATOR LINKS ─────────────────────────────────────────────────────
// Update these with your real Gumroad links after creating products
const PAID={
  quarterly:  {price:29, link:"https://gumroad.com/l/YOUR-QUARTERLY-PAID-LINK"},
  depreciation:{price:39, link:"https://gumroad.com/l/YOUR-DEPRECIATION-PAID-LINK"},
  capgains:   {price:29, link:"https://gumroad.com/l/YOUR-CAPGAINS-PAID-LINK"},
  str:        {price:29, link:"https://gumroad.com/l/YOUR-STR-PAID-LINK"},
  exchange:   {price:29, link:"https://gumroad.com/l/YOUR-1031-PAID-LINK"},
};

// ── PAYWALL LOCK COMPONENT ────────────────────────────────────────────────────
function PaywallLock({lang,product,children,features=[],style={}}){
  const L=lang||"en";
  const p=PAID[product]||{price:29,link:"#"};
  const labels={
    en:{unlock:"Unlock Full Analysis",free:"Free estimate above",get:"Get Full Access",per:"one-time",includes:"What you unlock:",already:"Already purchased?",redeem:"Enter your access code"},
    vi:{unlock:"Mở Khóa Phân Tích Đầy Đủ",free:"Ước tính miễn phí ở trên",get:"Mở Khóa Ngay",per:"một lần",includes:"Bạn nhận được:",already:"Đã mua rồi?",redeem:"Nhập mã truy cập"},
    es:{unlock:"Desbloquear Análisis Completo",free:"Estimación gratuita arriba",get:"Obtener Acceso Completo",per:"pago único",includes:"Lo que desbloqueas:",already:"¿Ya compró?",redeem:"Ingrese su código de acceso"},
  };
  const tx=labels[L]||labels.en;
  return(
    <div style={{position:"relative",...style}}>
      {/* Blurred preview of children */}
      <div style={{filter:"blur(3px)",pointerEvents:"none",userSelect:"none",opacity:0.4}}>
        {children}
      </div>
      {/* Lock overlay */}
      <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,display:"flex",alignItems:"center",justifyContent:"center",zIndex:10}}>
        <div style={{background:"linear-gradient(135deg,#0d1520ee,#0a1015ee)",border:`1px solid ${T.goldDim}`,borderRadius:12,padding:"28px 24px",textAlign:"center",maxWidth:340,width:"90%",backdropFilter:"blur(4px)"}}>
          <div style={{fontSize:28,marginBottom:10}}>🔒</div>
          <div style={{fontSize:15,color:T.gold,fontWeight:600,marginBottom:6}}>{tx.unlock}</div>
          <div style={{fontSize:11,color:T.textDim,marginBottom:14}}>{tx.free}</div>
          {features.length>0&&(
            <div style={{marginBottom:16,textAlign:"left"}}>
              <div style={{fontSize:10,color:T.textDim,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8}}>{tx.includes}</div>
              {features.map((f,i)=>(
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:6}}>
                  <span style={{color:T.green,fontSize:11,marginTop:1,flexShrink:0}}>✓</span>
                  <span style={{fontSize:11,color:T.textMid,lineHeight:1.4}}>{f}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{marginBottom:14}}>
            <span style={{fontSize:26,color:T.gold,fontWeight:300}}>${p.price}</span>
            <span style={{fontSize:11,color:T.textDim,marginLeft:6}}>{tx.per}</span>
          </div>
          <a href={p.link} target="_blank" rel="noopener noreferrer"
            style={{display:"block",padding:"12px 24px",borderRadius:8,fontSize:14,fontFamily:"inherit",cursor:"pointer",fontWeight:700,letterSpacing:"0.04em",
              background:`linear-gradient(135deg,${T.gold},${T.goldLight})`,color:"#050608",textDecoration:"none",marginBottom:10}}>
            {tx.get} — ${p.price}
          </a>
          <a href={PAID.exchange.link.replace("YOUR-1031-PAID-LINK","YOUR-BUNDLE-LINK").replace(PAID[product]?.link,"https://gumroad.com/l/YOUR-BUNDLE-LINK")} target="_blank" rel="noopener noreferrer"
            style={{display:"block",fontSize:11,color:T.textDim,textDecoration:"underline",marginBottom:8}}>
            {L==="vi"?"Hoặc mua gói 5 máy tính — $99":L==="es"?"O comprar paquete 5 calculadoras — $99":"Or get all 5 paid calculators — $99"}
          </a>
        </div>
      </div>
    </div>
  );
}

// ── SHARED UI ─────────────────────────────────────────────────────────────────
function Inp({value,onChange,placeholder,prefix,type="text"}){
  const [f,setF]=useState(false);
  return(
    <div style={{position:"relative"}}>
      {prefix&&<span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:f?T.gold:T.goldDim,fontSize:15,pointerEvents:"none"}}>{prefix}</span>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        onFocus={()=>setF(true)} onBlur={()=>setF(false)}
        style={{width:"100%",background:"#0a0c0f",border:`1px solid ${f?T.gold:T.border}`,borderRadius:6,
          padding:`10px 14px 10px ${prefix?"26px":"14px"}`,fontSize:15,color:T.text,
          fontFamily:"inherit",outline:"none",boxSizing:"border-box",transition:"border-color 0.2s"}}/>
    </div>
  );
}
function Sel({value,onChange,options}){
  const [f,setF]=useState(false);
  return(
    <select value={value} onChange={e=>onChange(e.target.value)} onFocus={()=>setF(true)} onBlur={()=>setF(false)}
      style={{width:"100%",background:"#0a0c0f",border:`1px solid ${f?T.gold:T.border}`,borderRadius:6,
        padding:"10px 14px",fontSize:14,color:T.text,fontFamily:"inherit",outline:"none",
        cursor:"pointer",appearance:"none",transition:"border-color 0.2s"}}>
      {options.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
    </select>
  );
}
function Textarea({value,onChange,placeholder,rows=4}){
  const [f,setF]=useState(false);
  return(
    <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
      onFocus={()=>setF(true)} onBlur={()=>setF(false)}
      style={{width:"100%",background:"#0a0c0f",border:`1px solid ${f?T.gold:T.border}`,borderRadius:6,
        padding:"10px 14px",fontSize:14,color:T.text,fontFamily:"inherit",outline:"none",
        boxSizing:"border-box",resize:"vertical",transition:"border-color 0.2s"}}/>
  );
}
function Fld({label,hint,optional,optLbl,children}){
  return(
    <div style={{marginBottom:16}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
        <label style={{fontSize:11,color:T.textMid,letterSpacing:"0.08em",textTransform:"uppercase"}}>{label}</label>
        {optional&&<span style={{fontSize:10,color:T.textDim,border:`1px solid ${T.border}`,borderRadius:3,padding:"1px 5px"}}>{optLbl||"optional"}</span>}
      </div>
      {children}
      {hint&&<p style={{fontSize:11,color:T.textDim,margin:"5px 0 0",lineHeight:1.5,fontStyle:"italic"}}>{hint}</p>}
    </div>
  );
}
function Card({children,accent,glow,style={}}){
  return(
    <div style={{background:T.bgCard,border:`1px solid ${accent?"#2a1840":glow?T.goldDim:T.border}`,
      borderRadius:10,padding:"22px",marginBottom:14,...style}}>
      {children}
    </div>
  );
}
function CardTitle({children,accent}){
  return <h3 style={{margin:"0 0 4px",fontSize:13,fontWeight:500,color:accent?"#a080d0":T.gold,letterSpacing:"0.06em",textTransform:"uppercase"}}>{children}</h3>;
}
function CardSub({children}){return <p style={{margin:"0 0 18px",fontSize:11,color:T.textDim}}>{children}</p>;}
function Btn({children,onClick,disabled,ghost,accent,full,small}){
  const [h,setH]=useState(false);
  return(
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{padding:small?"7px 16px":"10px 22px",borderRadius:6,fontSize:small?11:13,
        fontFamily:"inherit",cursor:disabled?"not-allowed":"pointer",letterSpacing:"0.04em",
        transition:"all 0.15s",width:full?"100%":"auto",
        background:ghost?"transparent":disabled?"#111":accent?(h?"#c090f0":"#7030a0"):(h?T.goldLight:T.gold),
        color:ghost?(h?T.textMid:T.textDim):disabled?"#333":"#050608",
        border:ghost?`1px solid ${T.border}`:"none",fontWeight:ghost?400:600}}>
      {children}
    </button>
  );
}
function NavRow({children}){return <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:20}}>{children}</div>;}
function IBox({children,tone,style={}}){
  const c=tone==="green"?{bg:T.greenBg,border:"#1a4020",text:T.green}
    :tone==="amber"?{bg:"#100e00",border:"#2a2600",text:"#8a7820"}
    :tone==="purple"?{bg:T.purpleBg,border:"#2a1840",text:"#8060a0"}
    :tone==="red"?{bg:T.redBg,border:"#3a1a0a",text:T.red}
    :{bg:T.accentBg,border:"#1a2030",text:T.accent};
  return <div style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:6,padding:"12px 14px",marginTop:12,fontSize:12,color:c.text,lineHeight:1.7,...style}}>{children}</div>;
}
function Divider(){return <div style={{borderTop:`1px solid ${T.border}`,margin:"16px 0"}}/>;}
function Toggle({value,onChange,label,desc}){
  return(
    <div onClick={()=>onChange(!value)} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"12px 14px",
      borderRadius:8,cursor:"pointer",transition:"all 0.15s",
      background:value?"rgba(128,64,176,0.08)":T.bgCard,border:`1px solid ${value?"#5030a0":T.border}`}}>
      <div style={{width:34,height:18,borderRadius:9,flexShrink:0,marginTop:2,
        background:value?T.purple:T.border,transition:"background 0.2s",position:"relative"}}>
        <div style={{position:"absolute",top:2,left:value?16:2,width:14,height:14,borderRadius:"50%",
          background:value?"#c0a0f0":T.textMid,transition:"left 0.2s"}}/>
      </div>
      <div>
        <div style={{fontSize:13,color:value?"#b080e0":T.textMid,marginBottom:2}}>{label}</div>
        <div style={{fontSize:11,color:T.textDim,lineHeight:1.5}}>{desc}</div>
      </div>
    </div>
  );
}
function SectionHeader({title,sub}){
  return(
    <div style={{marginBottom:32}}>
      <h2 style={{margin:"0 0 6px",fontSize:"clamp(20px,3.5vw,30px)",fontWeight:300,color:T.text,letterSpacing:"-0.01em"}}>{title}</h2>
      {sub&&<p style={{margin:0,color:T.textMid,fontSize:13}}>{sub}</p>}
    </div>
  );
}
function GoldBtn({children,onClick,full}){
  const [h,setH]=useState(false);
  return(
    <button onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{padding:"11px 24px",borderRadius:7,fontSize:13,fontFamily:"inherit",cursor:"pointer",
        fontWeight:600,letterSpacing:"0.04em",transition:"all 0.15s",width:full?"100%":"auto",
        background:`linear-gradient(135deg,${h?T.goldLight:T.gold},${T.goldLight})`,
        border:"none",color:"#050608"}}>
      {children}
    </button>
  );
}
function OutlineBtn({children,onClick}){
  const [h,setH]=useState(false);
  return(
    <button onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{padding:"11px 24px",borderRadius:7,fontSize:13,fontFamily:"inherit",cursor:"pointer",
        fontWeight:400,letterSpacing:"0.04em",transition:"all 0.15s",
        background:"transparent",border:`1px solid ${h?T.goldDim:T.border}`,color:h?T.textMid:T.textDim}}>
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATORS
// ═══════════════════════════════════════════════════════════════════════════════

// ── 1. UNDERPAYMENT ───────────────────────────────────────────────────────────
function UnderpaymentCalc({lang}){
  const L=lang||"en";
  const [step,setStep]=useState(0);
  const [inp,setInp]=useState({
    incomeType:"self",fs:"single",
    gross:"",expenses:"",
    w2income:"",w2wh:"",sideIncome:"",sideExpenses:"",
    rentalIncome:"",rentalExpenses:"",
    w2mixed:"",w2whMixed:"",selfMixed:"",selfExpMixed:"",rentalMixed:"",interestMixed:"",dividendsMixed:"",stcgMixed:"",ltcgMixed:"",
    skipCurrentYear:false,priorTax:"",priorAGI:"",
    unevenIncome:null,
    q1inc:"",q2inc:"",q3inc:"",q4inc:"",
    q1paid:"",q2paid:"",q3paid:"",q4paid:"",
  });
  const [res,setRes]=useState(null);
  const s=(k,v)=>setInp(p=>({...p,[k]:v}));

  const today=new Date();
  const currentYear=today.getFullYear();
  const QDATES=[new Date(currentYear,3,15),new Date(currentYear,5,16),new Date(currentYear,8,15),new Date(currentYear+1,0,15)];
  const QQ=[
    {l:"Q1",due:L==="vi"?"15/4":L==="es"?"15 abr":"April 15",days:91,mo:L==="vi"?"T1–3":L==="es"?"Ene–Mar":"Jan–Mar",past:today>QDATES[0]},
    {l:"Q2",due:L==="vi"?"16/6":L==="es"?"16 jun":"June 16",days:61,mo:L==="vi"?"T4–5":L==="es"?"Abr–May":"Apr–May",past:today>QDATES[1]},
    {l:"Q3",due:L==="vi"?"15/9":L==="es"?"15 sep":"Sept 15",days:91,mo:L==="vi"?"T6–8":L==="es"?"Jun–Ago":"Jun–Aug",past:today>QDATES[2]},
    {l:"Q4",due:L==="vi"?"15/1":L==="es"?"15 ene":"Jan 15",days:121,mo:L==="vi"?"T9–12":L==="es"?"Sep–Dic":"Sep–Dec",past:false},
  ];

  // Income & tax per type
  function calcIncome(){
    const it=inp.incomeType;
    if(it==="self"){
      const net=Math.max(0,parse(inp.gross)-parse(inp.expenses));
      const se=Math.round(net*0.9235*0.153);
      const tax=estTax(Math.max(0,net-se/2),inp.fs);
      return{net,wh:0,se,tax:se+tax,incTax:tax};
    }
    if(it==="both"){
      const w2=parse(inp.w2income), wh=parse(inp.w2wh);
      const side=Math.max(0,parse(inp.sideIncome)-parse(inp.sideExpenses));
      const se=Math.round(side*0.9235*0.153);
      const tax=estTax(Math.max(0,w2+side-se/2),inp.fs);
      return{net:w2+side,wh,se,tax:se+tax,incTax:tax};
    }
    if(it==="landlord"){
      const net=Math.max(0,parse(inp.rentalIncome)-parse(inp.rentalExpenses));
      const tax=estTax(net,inp.fs);
      return{net,wh:0,se:0,tax,incTax:tax};
    }
    if(it==="mixed"){
      const w2=parse(inp.w2mixed), wh=parse(inp.w2whMixed);
      const self=Math.max(0,parse(inp.selfMixed)-parse(inp.selfExpMixed));
      const rental=parse(inp.rentalMixed);
      const interest=parse(inp.interestMixed);
      const dividends=parse(inp.dividendsMixed);
      const stcg=parse(inp.stcgMixed);
      const ltcg=parse(inp.ltcgMixed);
      const se=Math.round(self*0.9235*0.153);
      const ordinaryIncome=Math.max(0,w2+self+rental+interest+dividends+stcg-se/2);
      const incTax=estTax(ordinaryIncome,inp.fs);
      const ltcgTax=cgTax(ltcg,inp.fs);
      const totalNet=w2+self+rental+interest+dividends+stcg+ltcg;
      return{net:totalNet,wh,se,tax:se+incTax+ltcgTax,incTax,ltcgTax,ltcg};
    }
    return{net:0,wh:0,se:0,tax:0,incTax:0};
  }

  const {net:netIncome,wh:derivedWH,se:seTax,tax:totalTax,incTax:incomeTax}=calcIncome();
  const priorAGI=parse(inp.priorAGI), thr=getThreshold(inp.fs);
  const shPct=priorAGI>thr?1.10:1.00;
  const priorSafeHarbor=parse(inp.priorTax)*shPct;
  const currentSafeHarbor=totalTax>0?totalTax*0.90:null; // only when income entered
  // Safe harbor = lesser of 90% current year OR 100/110% prior year
  // If only one is available, use that one
  const safeHarborAmount=
    priorSafeHarbor>0 && currentSafeHarbor!==null ? Math.min(currentSafeHarbor, priorSafeHarbor) :
    priorSafeHarbor>0 ? priorSafeHarbor :
    currentSafeHarbor!==null ? currentSafeHarbor : 0;

  const TX={
    title:L==="vi"?"Máy Tính Thuế Ước Tính Hàng Quý":L==="es"?"Calculadora de Impuesto Trimestral":"Quarterly Tax Payment Calculator",
    sub:L==="vi"?"Tính chính xác số tiền cần nộp mỗi quý để tránh bị IRS phạt":L==="es"?"Calcule cuánto pagar cada trimestre para evitar multas":"Calculate exactly how much to pay each quarter to avoid IRS penalties",
    step1title:L==="vi"?"Loại Thu Nhập":L==="es"?"Tipo de Ingresos":"Your Income Type",
    step2title:L==="vi"?"Thu Nhập Năm Nay":L==="es"?"Ingresos de Este Año":"This Year's Income",
    step3title:L==="vi"?"Thuế Năm Trước":L==="es"?"Impuesto del Año Anterior":"Prior Year Tax",
    step4title:L==="vi"?"Bạn Đã Nộp Bao Nhiêu?":L==="es"?"¿Cuánto Ha Pagado Ya?":"What Have You Paid So Far?",
    incomeTypes:[
      {v:"self",  icon:"💼",l:L==="vi"?"Tự kinh doanh / 1099":L==="es"?"Autónomo / 1099":"Self-employed / 1099",       desc:L==="vi"?"Freelancer, nail tech, môi giới, chủ doanh nghiệp":L==="es"?"Freelancer, contratista, dueño de negocio":"Freelancer, contractor, business owner"},
      {v:"both",  icon:"🏢",l:L==="vi"?"W-2 + Thu nhập phụ":L==="es"?"W-2 + Ingresos adicionales":"W-2 job + side income",  desc:L==="vi"?"Có lương + thu nhập 1099 hoặc kinh doanh thêm":L==="es"?"Salario más ingresos 1099 adicionales":"Have a salary plus 1099 or freelance income"},
      {v:"landlord",icon:"🏠",l:L==="vi"?"Chủ nhà cho thuê":L==="es"?"Propietario de alquiler":"Rental property owner",    desc:L==="vi"?"Thu nhập từ bất động sản cho thuê":L==="es"?"Ingresos de propiedades en alquiler":"Income from rental properties"},
      {v:"mixed",  icon:"📊",l:L==="vi"?"Kết hợp nhiều loại":L==="es"?"Múltiples fuentes":"Multiple income types",        desc:L==="vi"?"W-2 + tự kinh doanh + cho thuê":L==="es"?"W-2 + autónomo + alquiler":"W-2 + self-employment + rental"},
    ],
    FS:[
      {value:"single",label:L==="vi"?"Độc thân":L==="es"?"Soltero/a":"Single"},
      {value:"mfj",  label:L==="vi"?"Vợ chồng chung":L==="es"?"Casado conjunto":"Married Filing Jointly"},
      {value:"mfs",  label:L==="vi"?"Vợ chồng riêng":L==="es"?"Casado separado":"Married Filing Separately"},
      {value:"hoh",  label:L==="vi"?"Chủ hộ":L==="es"?"Jefe de hogar":"Head of Household"},
    ],
    fsL:L==="vi"?"Tình trạng khai thuế":L==="es"?"Estado civil":"Filing status",
    priorTaxL:L==="vi"?"Thuế liên bang năm trước":L==="es"?"Impuesto federal año anterior":"Prior year federal income tax",
    priorTaxH:L==="vi"?"Mẫu 1040 năm ngoái, Dòng 24":L==="es"?"Formulario 1040, Línea 24":"Last year's Form 1040, Line 24",
    priorAGIL:L==="vi"?"AGI năm trước":L==="es"?"AGI año anterior":"Prior year AGI",
    priorAGIH:L==="vi"?"Mẫu 1040 năm ngoái, Dòng 11":L==="es"?"Formulario 1040, Línea 11":"Form 1040, Line 11 — determines 100% vs 110% rule",
    unevenQ:L==="vi"?"Thu nhập có đều mỗi quý không?":L==="es"?"¿Ingresos similares cada trimestre?":"Is your income roughly the same each quarter?",
    unevenYes:L==="vi"?"Có, khá đều đặn":L==="es"?"Sí, bastante similar":"Yes, fairly even",
    unevenNo:L==="vi"?"Không, thay đổi đáng kể":L==="es"?"No, varía significativamente":"No, it varies significantly",
    next:L==="vi"?"Tiếp →":L==="es"?"Siguiente →":"Next →",
    back:L==="vi"?"← Quay lại":L==="es"?"← Atrás":"← Back",
    calc:L==="vi"?"Tính Ngay":L==="es"?"Calcular":"Calculate",
    again:L==="vi"?"Bắt Đầu Lại":L==="es"?"Comenzar de Nuevo":"Start Over",
    opt:L==="vi"?"tùy chọn":L==="es"?"opcional":"optional",
    disc:L==="vi"?"Chỉ ước tính — không phải tư vấn thuế. Dựa trên IRS Ấn phẩm 505.":L==="es"?"Solo estimaciones — no es asesoramiento fiscal.":"Estimates only — not tax advice. Based on IRS Publication 505 and Form 2210.",
  };

  const steps=[TX.step1title,TX.step2title,TX.step3title,TX.step4title];
  // canGo2: true if any income entered OR if user explicitly skips current year
  const hasIncome=inp.incomeType==="self"?parse(inp.gross)>0:inp.incomeType==="both"?parse(inp.w2income)>0||parse(inp.sideIncome)>0:inp.incomeType==="landlord"?parse(inp.rentalIncome)>0:parse(inp.w2mixed)>0||parse(inp.selfMixed)>0||parse(inp.rentalMixed)>0||parse(inp.interestMixed)>0||parse(inp.dividendsMixed)>0||parse(inp.stcgMixed)>0||parse(inp.ltcgMixed)>0;
  const canGo2=hasIncome||inp.skipCurrentYear===true;
  const canGo1=!!inp.incomeType;
  const canGo3=parse(inp.priorTax)>0&&parse(inp.priorAGI)>0;
  const canGo4=inp.unevenIncome!==null;
  const canGo=step===0?canGo1:step===1?canGo2:step===2?canGo3:canGo4;

  function doCalc(){
    const wh=derivedWH;
    const qPaid=[1,2,3,4].map(i=>parse(inp[`q${i}paid`]));
    const totalPaid=wh+qPaid.reduce((a,b)=>a+b,0);
    let qRequired=[];
    if(inp.unevenIncome===false){
      const pQ=safeHarborAmount/4;
      qRequired=[pQ,pQ,pQ,pQ];
    } else {
      const qInc=[1,2,3,4].map(i=>parse(inp[`q${i}inc`]));
      const cumInc=[qInc[0],qInc[0]+qInc[1],qInc[0]+qInc[1]+qInc[2],qInc[0]+qInc[1]+qInc[2]+qInc[3]];
      const cumReq=cumInc.map((ci,i)=>{
        const ann=ci*AI_FACTORS[i];
        const annSE=inp.incomeType==="landlord"?0:Math.round(ann*0.9235*0.153);
        const annTax=estTax(Math.max(0,ann-annSE/2),inp.fs)+annSE;
        return Math.min(annTax*AI_PCT[i],safeHarborAmount*(i+1)/4);
      });
      qRequired=cumReq.map((cr,i)=>Math.max(0,cr-(i>0?cumReq[i-1]:0)));
    }
    const perQWH=wh/4;
    let totalPenalty=0;
    const quarters=QQ.map((q,i)=>{
      const required=qRequired[i], paid=qPaid[i], whCredit=perQWH;
      const shortfall=Math.max(0,required-paid-whCredit);
      const penalty=q.past?Math.round(shortfall*(IRS_RATE/365)*q.days):0;
      totalPenalty+=penalty;
      return{...q,required,paid,whCredit,shortfall,penalty};
    });
    const nextQ=quarters.find(q=>!q.past&&q.shortfall>0)||quarters.find(q=>!q.past);
    const catchUp=quarters.filter(q=>q.past&&q.shortfall>0).reduce((a,q)=>a+q.shortfall,0);
    setRes({netIncome,wh,seTax,totalTax,incomeTax,safeHarborAmount,shPct,priorSafeHarbor,currentSafeHarbor,totalPaid,totalPenalty,quarters,nextQ,catchUp,unevenIncome:inp.unevenIncome,incomeType:inp.incomeType});
    setStep(4);
  }

  return(
    <div style={{maxWidth:600,margin:"0 auto"}}>
      <div style={{marginBottom:16}}>
        <h3 style={{margin:"0 0 4px",fontSize:15,fontWeight:400,color:T.gold}}>{TX.title}</h3>
        <p style={{margin:0,fontSize:12,color:T.textDim}}>{TX.sub}</p>
      </div>
      {/* Progress */}
      <div style={{display:"flex",gap:5,marginBottom:20}}>
        {steps.map((st,i)=>{const a=i===step,d=i<step;return(
          <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
            <div style={{height:2,width:"100%",borderRadius:1,background:d||a?T.gold:T.border,transition:"background 0.3s"}}/>
            <span style={{fontSize:8,letterSpacing:"0.06em",textTransform:"uppercase",textAlign:"center",color:a?T.gold:d?T.goldDim:T.textDim,lineHeight:1.3}}>{st}</span>
          </div>
        );})}
      </div>

      {/* STEP 0 */}
      {step===0&&(<Card>
        <CardTitle>{TX.step1title}</CardTitle>
        <CardSub>{L==="vi"?"Mỗi loại có cách tính thuế khác nhau":L==="es"?"Cada tipo calcula impuestos diferente":"Each type calculates taxes differently"}</CardSub>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
          {TX.incomeTypes.map(o=>(
            <button key={o.v} onClick={()=>s("incomeType",o.v)}
              style={{padding:"12px 14px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",textAlign:"left",transition:"all 0.15s",
                background:inp.incomeType===o.v?"rgba(200,169,110,0.1)":T.bgCard,
                border:`1px solid ${inp.incomeType===o.v?T.gold:T.border}`}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:18}}>{o.icon}</span>
                <div>
                  <div style={{fontSize:13,color:inp.incomeType===o.v?T.gold:T.text,fontWeight:500,marginBottom:1}}>{o.l}</div>
                  <div style={{fontSize:11,color:T.textDim}}>{o.desc}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
        <Fld label={TX.fsL}><Sel value={inp.fs} onChange={v=>s("fs",v)} options={TX.FS}/></Fld>
        <NavRow><div/><Btn onClick={()=>setStep(1)} disabled={!canGo}>{TX.next}</Btn></NavRow>
      </Card>)}

      {/* STEP 1 */}
      {step===1&&(<Card>
        <CardTitle>{TX.step2title}</CardTitle>
        {inp.incomeType==="self"&&(<>
          <CardSub>{L==="vi"?"SE tax 15.3% tự động tính":L==="es"?"SE tax 15.3% se calcula automáticamente":"SE tax 15.3% calculated automatically"}</CardSub>
          <Fld label={L==="vi"?"Tổng thu nhập kinh doanh":L==="es"?"Ingresos brutos":"Gross business income"} hint={L==="vi"?"Trước khi trừ chi phí":L==="es"?"Antes de gastos":"Before expenses"}><Inp value={inp.gross} onChange={v=>s("gross",v)} placeholder="0" prefix="$"/></Fld>
          <Fld label={L==="vi"?"Chi phí kinh doanh":L==="es"?"Gastos del negocio":"Business expenses"} hint={L==="vi"?"Marketing, xe hơi, văn phòng...":L==="es"?"Marketing, vehículo, oficina...":"Marketing, vehicle, office..."} optional optLbl={TX.opt}><Inp value={inp.expenses} onChange={v=>s("expenses",v)} placeholder="0" prefix="$"/></Fld>
          {parse(inp.gross)>0&&<IBox tone="green">{L==="vi"?"Ròng":L==="es"?"Neto":"Net"}: <strong>{fmt(netIncome)}</strong> · SE: <strong>{fmt(seTax)}</strong> · {L==="vi"?"Thuế TN":L==="es"?"Renta":"Income tax"}: <strong>{fmt(incomeTax)}</strong> · <strong style={{color:T.gold}}>{L==="vi"?"Tổng":L==="es"?"Total":"Total"}: {fmt(totalTax)}</strong></IBox>}
        </>)}
        {inp.incomeType==="both"&&(<>
          <CardSub>{L==="vi"?"SE tax chỉ cho thu nhập phụ":L==="es"?"SE tax solo a ingresos adicionales":"SE tax only on side income, not W-2"}</CardSub>
          <div style={{padding:"12px 14px",background:T.bgCard2,border:`1px solid ${T.border}`,borderRadius:8,marginBottom:10}}>
            <p style={{fontSize:11,color:T.gold,margin:"0 0 8px",fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase"}}>W-2</p>
            <Fld label={L==="vi"?"Lương W-2 gộp":L==="es"?"Salario W-2 bruto":"W-2 gross salary"}><Inp value={inp.w2income} onChange={v=>s("w2income",v)} placeholder="0" prefix="$"/></Fld>
            <Fld label={L==="vi"?"Khấu trừ W-2 (Box 2)":L==="es"?"Retención W-2 (Casilla 2)":"W-2 withholding (Box 2)"}><Inp value={inp.w2wh} onChange={v=>s("w2wh",v)} placeholder="0" prefix="$"/></Fld>
          </div>
          <div style={{padding:"12px 14px",background:T.bgCard2,border:`1px solid ${T.border}`,borderRadius:8,marginBottom:10}}>
            <p style={{fontSize:11,color:T.gold,margin:"0 0 8px",fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase"}}>{L==="vi"?"Thu nhập phụ / 1099":L==="es"?"Ingresos adicionales / 1099":"Side income / 1099"}</p>
            <Fld label={L==="vi"?"Thu nhập phụ gộp":L==="es"?"Ingresos adicionales brutos":"Gross side income"}><Inp value={inp.sideIncome} onChange={v=>s("sideIncome",v)} placeholder="0" prefix="$"/></Fld>
            <Fld label={L==="vi"?"Chi phí liên quan":L==="es"?"Gastos relacionados":"Related expenses"} optional optLbl={TX.opt}><Inp value={inp.sideExpenses} onChange={v=>s("sideExpenses",v)} placeholder="0" prefix="$"/></Fld>
          </div>
          {(parse(inp.w2income)>0||parse(inp.sideIncome)>0)&&<IBox tone="green">{L==="vi"?"Tổng":L==="es"?"Total":"Total"}: <strong>{fmt(netIncome)}</strong>{seTax>0&&<> · SE: <strong>{fmt(seTax)}</strong></>} · <strong style={{color:T.gold}}>{fmt(totalTax)}</strong> · W-2 KT: <strong>{fmt(parse(inp.w2wh))}</strong></IBox>}
        </>)}
        {inp.incomeType==="landlord"&&(<>
          <CardSub>{L==="vi"?"Không có SE tax — thu nhập cho thuê là thu nhập thường":L==="es"?"Sin SE tax — alquiler es renta ordinaria":"No SE tax — rental = ordinary income"}</CardSub>
          <Fld label={L==="vi"?"Tổng thu nhập cho thuê":L==="es"?"Ingresos totales de alquiler":"Total rental income"} hint={L==="vi"?"Tất cả bất động sản":L==="es"?"Todas las propiedades":"All properties combined"}><Inp value={inp.rentalIncome} onChange={v=>s("rentalIncome",v)} placeholder="0" prefix="$"/></Fld>
          <Fld label={L==="vi"?"Tổng chi phí cho thuê":L==="es"?"Gastos totales de alquiler":"Total rental expenses"} hint={L==="vi"?"Thế chấp, sửa chữa, khấu hao, bảo hiểm...":L==="es"?"Hipoteca, reparaciones, depreciación, seguro...":"Mortgage interest, repairs, depreciation, insurance..."} optional optLbl={TX.opt}><Inp value={inp.rentalExpenses} onChange={v=>s("rentalExpenses",v)} placeholder="0" prefix="$"/></Fld>
          {parse(inp.rentalIncome)>0&&<IBox tone="green">{L==="vi"?"Thu nhập ròng":L==="es"?"Neto":"Net rental"}: <strong>{fmt(netIncome)}</strong> · {L==="vi"?"Không SE tax":L==="es"?"Sin SE tax":"No SE tax"} · <strong style={{color:T.gold}}>{L==="vi"?"Thuế ước tính":L==="es"?"Est.":"Est. tax"}: {fmt(totalTax)}</strong></IBox>}
        </>)}
        {inp.incomeType==="mixed"&&(<>
          <CardSub>{L==="vi"?"Nhập tất cả nguồn thu nhập bên dưới":L==="es"?"Ingrese todas sus fuentes de ingresos":"Enter all your income sources below"}</CardSub>
          <div style={{padding:"12px 14px",background:T.bgCard2,border:`1px solid ${T.border}`,borderRadius:8,marginBottom:8}}>
            <p style={{fontSize:11,color:T.gold,margin:"0 0 8px",fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase"}}>W-2</p>
            <Fld label={L==="vi"?"Thu nhập W-2":L==="es"?"Ingreso W-2":"W-2 income"} optional optLbl={TX.opt}><Inp value={inp.w2mixed} onChange={v=>s("w2mixed",v)} placeholder="0" prefix="$"/></Fld>
            <Fld label={L==="vi"?"Khấu trừ W-2":L==="es"?"Retención W-2":"W-2 withholding"} optional optLbl={TX.opt}><Inp value={inp.w2whMixed} onChange={v=>s("w2whMixed",v)} placeholder="0" prefix="$"/></Fld>
          </div>
          <div style={{padding:"12px 14px",background:T.bgCard2,border:`1px solid ${T.border}`,borderRadius:8,marginBottom:8}}>
            <p style={{fontSize:11,color:T.gold,margin:"0 0 8px",fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase"}}>{L==="vi"?"Tự kinh doanh":L==="es"?"Autónomo":"Self-employment"}</p>
            <Fld label={L==="vi"?"Thu nhập gộp":L==="es"?"Ingresos brutos":"Gross income"} optional optLbl={TX.opt}><Inp value={inp.selfMixed} onChange={v=>s("selfMixed",v)} placeholder="0" prefix="$"/></Fld>
            <Fld label={L==="vi"?"Chi phí":L==="es"?"Gastos":"Expenses"} optional optLbl={TX.opt}><Inp value={inp.selfExpMixed} onChange={v=>s("selfExpMixed",v)} placeholder="0" prefix="$"/></Fld>
          </div>
          <div style={{padding:"12px 14px",background:T.bgCard2,border:`1px solid ${T.border}`,borderRadius:8,marginBottom:8}}>
            <p style={{fontSize:11,color:T.gold,margin:"0 0 8px",fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase"}}>{L==="vi"?"Thu nhập cho thuê (ròng)":L==="es"?"Alquiler (neto)":"Rental (net)"}</p>
            <Fld label={L==="vi"?"Thu nhập cho thuê ròng":L==="es"?"Ingreso neto de alquiler":"Net rental income"} optional optLbl={TX.opt}><Inp value={inp.rentalMixed} onChange={v=>s("rentalMixed",v)} placeholder="0" prefix="$"/></Fld>
          </div>
          <div style={{padding:"12px 14px",background:T.bgCard2,border:`1px solid ${T.border}`,borderRadius:8,marginBottom:8}}>
            <p style={{fontSize:11,color:T.gold,margin:"0 0 8px",fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase"}}>{L==="vi"?"Thu nhập đầu tư":L==="es"?"Ingresos de inversión":"Investment income"}</p>
            <p style={{fontSize:10,color:T.textDim,margin:"0 0 10px",fontStyle:"italic"}}>{L==="vi"?"Không có SE tax cho các loại thu nhập này":L==="es"?"Sin SE tax para estos ingresos":"No SE tax on these income types"}</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <Fld label={L==="vi"?"Tiền lãi (Interest)":L==="es"?"Intereses":"Interest income"} hint={L==="vi"?"Tài khoản tiết kiệm, CD, trái phiếu":L==="es"?"Cuentas de ahorro, CD, bonos":"Savings, CDs, bonds"} optional optLbl={TX.opt}><Inp value={inp.interestMixed} onChange={v=>s("interestMixed",v)} placeholder="0" prefix="$"/></Fld>
              <Fld label={L==="vi"?"Cổ tức (Dividends)":L==="es"?"Dividendos":"Dividends"} hint={L==="vi"?"Cổ tức thông thường và đủ điều kiện":L==="es"?"Ordinarios y calificados":"Ordinary and qualified dividends"} optional optLbl={TX.opt}><Inp value={inp.dividendsMixed} onChange={v=>s("dividendsMixed",v)} placeholder="0" prefix="$"/></Fld>
              <Fld label={L==="vi"?"Lợi vốn ngắn hạn":L==="es"?"Ganancias capital C/P":"Short-term cap gains"} hint={L==="vi"?"Giữ dưới 1 năm — tính như thu nhập thường":L==="es"?"Menos de 1 año — tasa ordinaria":"Held under 1 year — taxed as ordinary income"} optional optLbl={TX.opt}><Inp value={inp.stcgMixed} onChange={v=>s("stcgMixed",v)} placeholder="0" prefix="$"/></Fld>
              <Fld label={L==="vi"?"Lợi vốn dài hạn":L==="es"?"Ganancias capital L/P":"Long-term cap gains"} hint={L==="vi"?"Giữ trên 1 năm — thuế suất 0/15/20%":L==="es"?"Más de 1 año — tasa 0/15/20%":"Held over 1 year — taxed at 0/15/20%"} optional optLbl={TX.opt}><Inp value={inp.ltcgMixed} onChange={v=>s("ltcgMixed",v)} placeholder="0" prefix="$"/></Fld>
            </div>
            {parse(inp.ltcgMixed)>0&&<IBox tone="purple">{L==="vi"?"Thuế lợi vốn dài hạn ước tính":L==="es"?"Impuesto ganancias L/P estimado":"Est. long-term capital gains tax"}: <strong style={{color:"#c090f0"}}>{fmt(cgTax(parse(inp.ltcgMixed),inp.fs))}</strong> ({L==="vi"?"tỷ lệ ưu đãi — riêng biệt với thuế thu nhập thường":L==="es"?"tasa preferencial — separado del impuesto ordinario":"preferential rate — separate from ordinary income tax"})</IBox>}
          </div>
          {netIncome>0&&<IBox tone="green">
            {L==="vi"?"Tổng":L==="es"?"Total":"Total"}: <strong>{fmt(netIncome)}</strong>
            {seTax>0&&<> · SE: <strong>{fmt(seTax)}</strong></>}
            {" · "}{L==="vi"?"Tổng thuế ước tính":L==="es"?"Total impuesto":"Total est. tax"}: <strong style={{color:T.gold}}>{fmt(totalTax)}</strong>
            {parse(inp.w2whMixed)>0&&<> · {L==="vi"?"Khấu trừ W-2":L==="es"?"Retención W-2":"W-2 withheld"}: <strong>{fmt(parse(inp.w2whMixed))}</strong></>}
            {parse(inp.ltcgMixed)>0&&<> · {L==="vi"?"Thuế LTCG":L==="es"?"LTCG tax":"LTCG tax"}: <strong>{fmt(cgTax(parse(inp.ltcgMixed),inp.fs))}</strong></>}
          </IBox>}
        </>)}
        {!hasIncome&&(
          <IBox tone="amber">
            {L==="vi"?"Chưa biết thu nhập năm nay? Bỏ qua — chúng tôi sẽ dùng thuế năm trước để tính safe harbor.":L==="es"?"¿No sabe sus ingresos de este año? Omita — usaremos el impuesto del año anterior para el puerto seguro.":"Don't know this year's income yet? Skip — we'll use prior year tax for safe harbor only."}
          </IBox>
        )}
        <NavRow>
          <Btn ghost onClick={()=>setStep(0)}>{TX.back}</Btn>
          <div style={{display:"flex",gap:8}}>
            {!hasIncome&&<Btn ghost small onClick={()=>{s("skipCurrentYear",true);setStep(2);}}>{L==="vi"?"Bỏ qua →":L==="es"?"Omitir →":"Skip →"}</Btn>}
            <Btn onClick={()=>{s("skipCurrentYear",false);setStep(2);}} disabled={!canGo}>{TX.next}</Btn>
          </div>
        </NavRow>
      </Card>)}

      {/* STEP 2 */}
      {step===2&&(<Card>
        <CardTitle>{TX.step3title}</CardTitle>
        <CardSub>{inp.skipCurrentYear?(L==="vi"?"Sử dụng thuế năm trước làm safe harbor (bỏ qua năm hiện tại)":L==="es"?"Usando impuesto del año anterior como puerto seguro (año actual omitido)":"Using prior year tax as safe harbor (current year skipped)"):(L==="vi"?"Dùng để tính ngưỡng an toàn":L==="es"?"Para calcular el puerto seguro":"Used to calculate your safe harbor amount")}</CardSub>
        <Fld label={TX.priorTaxL} hint={TX.priorTaxH}><Inp value={inp.priorTax} onChange={v=>s("priorTax",v)} placeholder="0" prefix="$"/></Fld>
        <Fld label={TX.priorAGIL} hint={TX.priorAGIH}><Inp value={inp.priorAGI} onChange={v=>s("priorAGI",v)} placeholder="0" prefix="$"/></Fld>
        {parse(inp.priorAGI)>0&&parse(inp.priorTax)>0&&(
          <IBox tone={priorAGI>thr?undefined:"green"}>
            {priorAGI>thr
              ?<>AGI &gt; <strong>${thr.toLocaleString()}</strong> → <strong>110%</strong> {L==="vi"?"thuế năm trước":L==="es"?"impuesto anterior":"prior year tax"} = <strong>{fmt(parse(inp.priorTax)*1.10)}</strong></>
              :<>AGI &lt; <strong>${thr.toLocaleString()}</strong> → <strong>100%</strong> {L==="vi"?"thuế năm trước":L==="es"?"impuesto anterior":"prior year tax"} = <strong>{fmt(parse(inp.priorTax))}</strong></>
            }
            {currentSafeHarbor!==null&&<> · 90% {L==="vi"?"thuế năm nay":L==="es"?"impuesto actual":"current year tax"} = <strong>{fmt(currentSafeHarbor)}</strong></>}
            {" · "}{L==="vi"?"Dùng số nhỏ hơn":L==="es"?"Se usa el menor":"Safe harbor (lower)"}: <strong style={{color:T.gold}}>{fmt(safeHarborAmount)}</strong>
            {currentSafeHarbor!==null&&(
              currentSafeHarbor<priorSafeHarbor
                ?<> ✓ {L==="vi"?"(90% năm nay thấp hơn — dễ đạt hơn)":L==="es"?"(90% actual es menor — más fácil)":"(90% current year wins — easier to meet)"}</>
                :<> ✓ {L==="vi"?"(năm trước thấp hơn)":L==="es"?"(año anterior es menor)":"(prior year wins)"}</>
            )}
          </IBox>
        )}
        <NavRow><Btn ghost onClick={()=>setStep(1)}>{TX.back}</Btn><Btn onClick={()=>setStep(3)} disabled={!canGo}>{TX.next}</Btn></NavRow>
      </Card>)}

      {/* STEP 3 */}
      {step===3&&(<Card>
        <CardTitle>{TX.step4title}</CardTitle>
        <CardSub>{L==="vi"?"Không bao gồm khấu trừ W-2 (đã tự động tính)":L==="es"?"No incluir retención W-2 (ya calculada)":"Do not include W-2 withholding (already counted)"}</CardSub>
        <Fld label={TX.unevenQ}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[{v:false,l:TX.unevenYes},{v:true,l:TX.unevenNo}].map(o=>(
              <button key={String(o.v)} onClick={()=>s("unevenIncome",o.v)}
                style={{padding:"11px 8px",borderRadius:7,cursor:"pointer",fontFamily:"inherit",fontSize:12,lineHeight:1.4,textAlign:"center",transition:"all 0.15s",
                  background:inp.unevenIncome===o.v?"rgba(200,169,110,0.1)":T.bgCard,
                  border:`1px solid ${inp.unevenIncome===o.v?T.gold:T.border}`,color:inp.unevenIncome===o.v?T.gold:T.textMid}}>
                {o.l}
              </button>
            ))}
          </div>
        </Fld>
        {inp.unevenIncome===true&&(
          <div style={{margin:"12px 0",padding:"12px 14px",background:T.bgCard2,border:`1px solid ${T.border}`,borderRadius:8}}>
            <p style={{fontSize:11,color:T.textMid,margin:"0 0 10px"}}>{L==="vi"?"Thu nhập thực tế từng quý:":L==="es"?"Ingresos reales por trimestre:":"Actual income each quarter:"}</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {QQ.map((q,i)=><Fld key={i} label={`${q.l} · ${q.mo}`}><Inp value={inp[`q${i+1}inc`]} onChange={v=>s(`q${i+1}inc`,v)} placeholder="0" prefix="$"/></Fld>)}
            </div>
          </div>
        )}
        {inp.unevenIncome!==null&&(<>
          <Divider/>
          <p style={{fontSize:11,color:T.textMid,margin:"0 0 10px",fontWeight:500}}>{L==="vi"?"Đã nộp trực tiếp IRS mỗi quý:":L==="es"?"Pagado directamente al IRS por trimestre:":"Direct IRS payments made each quarter:"}</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {QQ.map((q,i)=><Fld key={i} label={`${q.l} · ${q.due}`} hint={q.past?(L==="vi"?"Đã qua hạn":L==="es"?"Ya venció":"Past due"):(L==="vi"?"Chưa đến hạn":L==="es"?"Próximo":"Upcoming")}><Inp value={inp[`q${i+1}paid`]} onChange={v=>s(`q${i+1}paid`,v)} placeholder="0" prefix="$"/></Fld>)}
          </div>
        </>)}
        <NavRow><Btn ghost onClick={()=>setStep(2)}>{TX.back}</Btn><Btn onClick={doCalc} disabled={!canGo}>{TX.calc}</Btn></NavRow>
      </Card>)}

      {/* RESULTS */}
      {step===4&&res&&(<div>

        {/* ── DUAL PAYMENT COMPARISON — the key new section ── */}
        {res.totalTax>0&&(()=>{
          const shPerQ=res.safeHarborAmount/4;
          const actualPerQ=res.totalTax/4;
          const remainingQs=QQ.filter(q=>!q.past).length;
          const alreadyPaid=res.totalPaid;
          const shRemaining=Math.max(0,res.safeHarborAmount-alreadyPaid);
          const actualRemaining=Math.max(0,res.totalTax-alreadyPaid);
          const balanceDueAtFiling=Math.max(0,res.totalTax-res.safeHarborAmount);
          const overpayIfActual=Math.max(0,res.safeHarborAmount-res.totalTax);
          const diff=Math.abs(actualPerQ-shPerQ);
          const useActual=diff<200; // within $200/quarter — just pay actual

          return(
            <div style={{marginBottom:14}}>
              {/* Header */}
              <div style={{marginBottom:10}}>
                <h4 style={{margin:"0 0 4px",fontSize:13,fontWeight:500,color:T.gold,letterSpacing:"0.06em",textTransform:"uppercase"}}>{L==="vi"?"Hai Lựa Chọn Thanh Toán":L==="es"?"Sus Dos Opciones de Pago":"Your Two Payment Options"}</h4>
                <p style={{margin:0,fontSize:11,color:T.textDim}}>{L==="vi"?"Chọn cách tiếp cận phù hợp với tình huống của bạn":L==="es"?"Elija el enfoque que mejor se adapte a su situación":"Choose the approach that fits your situation"}</p>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                {/* Option 1 — Safe Harbor */}
                <div style={{background:"linear-gradient(135deg,#0a1a0e,#081208)",border:"1px solid #1a4020",borderRadius:10,padding:"16px 14px"}}>
                  <div style={{fontSize:9,letterSpacing:"0.2em",textTransform:"uppercase",color:"#2a6030",marginBottom:6}}>
                    {L==="vi"?"Lựa Chọn 1":L==="es"?"Opción 1":"Option 1"}
                  </div>
                  <div style={{fontSize:11,color:T.green,fontWeight:600,marginBottom:8}}>
                    {L==="vi"?"Safe Harbor — Tránh Phạt":L==="es"?"Puerto Seguro — Sin Multa":"Safe Harbor — No Penalty"}
                  </div>
                  <div style={{fontSize:"clamp(22px,4vw,30px)",color:T.green,fontWeight:300,lineHeight:1,marginBottom:4}}>{fmt(shPerQ)}</div>
                  <div style={{fontSize:10,color:"#3a7040",marginBottom:10}}>{L==="vi"?"mỗi quý":L==="es"?"por trimestre":"per quarter"}</div>
                  <div style={{borderTop:"1px solid #1a3020",paddingTop:10}}>
                    <div style={{fontSize:11,color:"#3a7040",marginBottom:4}}>✓ {L==="vi"?"Không bị phạt IRS":L==="es"?"Sin multa del IRS":"No IRS penalty"}</div>
                    {balanceDueAtFiling>0&&(
                      <div style={{fontSize:11,color:T.red,marginBottom:4}}>⚠ {L==="vi"?"Còn nợ khi khai thuế":L==="es"?"Deberá al presentar":"Balance due at filing"}: <strong>{fmt(balanceDueAtFiling)}</strong></div>
                    )}
                    {balanceDueAtFiling===0&&<div style={{fontSize:11,color:"#3a7040"}}>✓ {L==="vi"?"Không nợ thêm khi khai thuế":L==="es"?"Sin saldo al presentar":"No balance due at filing"}</div>}
                  </div>
                </div>

                {/* Option 2 — Actual Estimate */}
                <div style={{background:"linear-gradient(135deg,#0a100e,#060e0c)",border:`1px solid ${T.goldDim}`,borderRadius:10,padding:"16px 14px"}}>
                  <div style={{fontSize:9,letterSpacing:"0.2em",textTransform:"uppercase",color:T.goldDim,marginBottom:6}}>
                    {L==="vi"?"Lựa Chọn 2":L==="es"?"Opción 2":"Option 2"}
                  </div>
                  <div style={{fontSize:11,color:T.gold,fontWeight:600,marginBottom:8}}>
                    {L==="vi"?"Ước Tính Thực — Không Bất Ngờ":L==="es"?"Estimado Real — Sin Sorpresas":"Actual Estimate — No Surprises"}
                  </div>
                  <div style={{fontSize:"clamp(22px,4vw,30px)",color:T.gold,fontWeight:300,lineHeight:1,marginBottom:4}}>{fmt(actualPerQ)}</div>
                  <div style={{fontSize:10,color:T.goldDim,marginBottom:10}}>{L==="vi"?"mỗi quý":L==="es"?"por trimestre":"per quarter"}</div>
                  <div style={{borderTop:`1px solid ${T.goldDim}`,paddingTop:10}}>
                    <div style={{fontSize:11,color:T.gold,marginBottom:4}}>✓ {L==="vi"?"Không bị phạt IRS":L==="es"?"Sin multa del IRS":"No IRS penalty"}</div>
                    <div style={{fontSize:11,color:T.green,marginBottom:4}}>✓ {L==="vi"?"Không nợ thêm khi khai thuế":L==="es"?"Sin saldo al presentar":"No surprise balance at filing"}</div>
                    {overpayIfActual>0&&<div style={{fontSize:11,color:"#3a7040"}}>✓ {L==="vi"?"Hoàn thuế ước tính":L==="es"?"Reembolso estimado":"Est. refund"}: {fmt(overpayIfActual)}</div>}
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              {useActual?(
                <IBox tone="green">
                  💡 <strong>{L==="vi"?"Gợi ý":L==="es"?"Recomendación":"Recommendation"}:</strong> {L==="vi"?"Hai lựa chọn gần nhau — hãy trả theo ước tính thực tế để tránh bất ngờ khi khai thuế. Chênh lệch chỉ":L==="es"?"Las dos opciones son similares — pague el estimado real para evitar sorpresas. La diferencia es solo":"Both options are close — just pay the actual estimate to avoid any filing surprise. Difference is only"} <strong>{fmt(diff)}/quarter</strong>.
                </IBox>
              ):balanceDueAtFiling>500?(
                <IBox tone="red">
                  ⚠ <strong>{L==="vi"?"Cảnh báo":L==="es"?"Advertencia":"Warning"}:</strong> {L==="vi"?"Nếu chỉ trả safe harbor, bạn sẽ nợ":L==="es"?"Si solo paga el puerto seguro, deberá":"If you only pay safe harbor, you'll owe"} <strong>{fmt(balanceDueAtFiling)}</strong> {L==="vi"?"khi khai thuế — không bị phạt nhưng sẽ bất ngờ. Cân nhắc trả theo ước tính thực tế để tránh điều này.":L==="es"?"al presentar — sin multa pero habrá sorpresa. Considere pagar el estimado real para evitar esto.":"when you file — no penalty but a big surprise. Consider paying the actual estimate to avoid this."}
                </IBox>
              ):(
                <IBox>
                  💡 {L==="vi"?"Cả hai lựa chọn đều hợp lệ. Safe harbor đảm bảo không bị phạt. Ước tính thực tế đảm bảo không bất ngờ khi khai thuế.":L==="es"?"Ambas opciones son válidas. El puerto seguro garantiza sin multa. El estimado real garantiza sin sorpresa al presentar.":"Both options are valid. Safe harbor guarantees no penalty. Actual estimate guarantees no filing surprise."}
                </IBox>
              )}
            </div>
          );
        })()}

        {/* ── NEXT PAYMENT DUE ── */}
        {res.nextQ&&res.nextQ.shortfall>0?(
          <div style={{background:"linear-gradient(135deg,#0d1a08,#0a1505)",border:"1px solid #1a4020",borderRadius:12,padding:"20px",textAlign:"center",marginBottom:12}}>
            <div style={{fontSize:9,letterSpacing:"0.3em",textTransform:"uppercase",color:"#2a6030",marginBottom:6}}>{L==="vi"?"Thanh Toán Safe Harbor Tiếp Theo":L==="es"?"Próximo Pago Puerto Seguro":"Next Safe Harbor Payment"}</div>
            <div style={{fontSize:"clamp(32px,6vw,48px)",fontWeight:300,color:T.green,letterSpacing:"-0.02em",lineHeight:1}}>{fmt(res.nextQ.shortfall)}</div>
            <div style={{fontSize:12,color:"#3a8050",marginTop:6}}>{L==="vi"?"đến hạn":L==="es"?"vence":"due by"} <strong style={{color:T.gold}}>{res.nextQ.due}</strong></div>
            {res.catchUp>0&&<div style={{fontSize:10,color:"#5a7050",marginTop:4}}>({L==="vi"?"gồm bù đắp quý trước":"includes catch-up"}: {fmt(res.catchUp)})</div>}
          </div>
        ):(
          <div style={{background:T.greenBg,border:"1px solid #1a4020",borderRadius:12,padding:"16px",textAlign:"center",marginBottom:12}}>
            <div style={{fontSize:18,marginBottom:4}}>✓</div>
            <div style={{fontSize:13,fontWeight:500,color:T.green}}>{L==="vi"?"Safe harbor đã được thanh toán đầy đủ!":L==="es"?"¡Puerto seguro completamente pagado!":"Safe harbor fully paid!"}</div>
          </div>
        )}

        {/* ── SUMMARY CARDS ── */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:12}}>
          {[
            {l:L==="vi"?"Thuế Ước Tính":L==="es"?"Impuesto Est.":"Est. Total Tax",v:fmt(res.totalTax),gold:true},
            {l:L==="vi"?"Safe Harbor":L==="es"?"Puerto Seguro":"Safe Harbor",v:fmt(res.safeHarborAmount)},
            {l:L==="vi"?"Đã Nộp":L==="es"?"Ya Pagado":"Total Paid",v:fmt(res.totalPaid)},
            {l:L==="vi"?"Tiền Phạt":L==="es"?"Multa":"Est. Penalty",v:fmt(res.totalPenalty),hi:res.totalPenalty>0},
          ].map((it,i)=>(
            <div key={i} style={{background:T.bgCard,border:`1px solid ${it.hi?T.goldDim:it.gold?T.goldDim:T.border}`,borderRadius:8,padding:"10px 10px"}}>
              <div style={{fontSize:8,color:T.textDim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:3,lineHeight:1.3}}>{it.l}</div>
              <div style={{fontSize:14,color:it.hi?T.red:it.gold?T.gold:T.text,fontWeight:300}}>{it.v}</div>
            </div>
          ))}
        </div>

        {/* ── QUARTER TABLE ── */}
        <Card>
          <CardTitle>{L==="vi"?"Chi Tiết Từng Quý":L==="es"?"Por Trimestre":"Quarter Breakdown"}</CardTitle>
          <div style={{overflowX:"auto",marginTop:8}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:480}}>
              <thead><tr style={{borderBottom:`1px solid ${T.border}`}}>
                {[L==="vi"?"Quý":"Qtr",
                  L==="vi"?"Đáo Hạn":"Due",
                  L==="vi"?"Safe Harbor":"Safe Harbor",
                  L==="vi"?"Ước Tính TT":"Actual Est.",
                  "W-2",
                  L==="vi"?"Đã Nộp":"Paid",
                  L==="vi"?"Còn Thiếu (SH)":"Still Owe (SH)",
                  ""].map((h,i)=>(
                  <th key={i} style={{textAlign:"left",padding:"5px 4px 5px 0",color:T.textDim,fontWeight:400,fontSize:8,letterSpacing:"0.06em",textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {res.quarters.map((q,i)=>{
                  const actualReq=res.totalTax>0?res.totalTax/4:0;
                  return(
                    <tr key={i} style={{borderBottom:`1px solid ${T.border}`}}>
                      <td style={{padding:"8px 4px 8px 0",color:T.gold,fontWeight:500}}>{q.l}</td>
                      <td style={{padding:"8px 4px 8px 0",color:T.textMid,whiteSpace:"nowrap"}}>{q.due}</td>
                      <td style={{padding:"8px 4px 8px 0",color:T.green}}>{fmt(q.required)}</td>
                      <td style={{padding:"8px 4px 8px 0",color:T.gold,fontStyle:"italic"}}>{res.totalTax>0?fmt(actualReq):"—"}</td>
                      <td style={{padding:"8px 4px 8px 0",color:T.textMid}}>{fmt(q.whCredit)}</td>
                      <td style={{padding:"8px 4px 8px 0",color:T.textMid}}>{fmt(q.paid)}</td>
                      <td style={{padding:"8px 4px 8px 0",color:q.shortfall>0?T.red:T.green,fontWeight:q.shortfall>0?600:400}}>{q.shortfall>0?fmt(q.shortfall):"$0 ✓"}</td>
                      <td style={{padding:"8px 4px 8px 0",color:!q.past?T.textDim:q.shortfall>0?T.red:T.green,fontSize:11}}>{!q.past?"→":q.shortfall>0?"⚠":"✓"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {res.totalPenalty>0&&<IBox tone="red">⚠ {L==="vi"?"Phạt ước tính":L==="es"?"Multa estimada":"Est. penalty for past underpayments"}: <strong>{fmt(res.totalPenalty)}</strong></IBox>}
        </Card>

        {/* ── PAYMENT PLAN ── */}
        <Card>
          <CardTitle>{L==="vi"?"Kế Hoạch Thanh Toán":L==="es"?"Plan de Pagos":"Payment Plan"}</CardTitle>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:8}}>
            {res.quarters.filter(q=>!q.past&&q.shortfall>0).length===0
              ? <div style={{fontSize:13,color:T.green}}>✓ {L==="vi"?"Safe harbor đã đủ cho tất cả quý còn lại!":L==="es"?"¡Puerto seguro cubierto para todos los trimestres!":"Safe harbor covered for all remaining quarters!"}</div>
              : res.quarters.map((q,i)=>{
                  if(q.shortfall===0&&q.past)return null;
                  const actualReq=res.totalTax>0?res.totalTax/4:0;
                  const actualShortfall=Math.max(0,actualReq-q.paid-q.whCredit);
                  return(
                    <div key={i} style={{borderRadius:8,border:`1px solid ${q.past&&q.shortfall>0?"#3a1a0a":q.shortfall>0?"#1a4020":T.border}`,overflow:"hidden",opacity:q.shortfall===0&&!q.past?0.6:1}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",
                        background:q.past&&q.shortfall>0?T.redBg:q.shortfall>0?T.greenBg:T.bgCard2}}>
                        <div>
                          <div style={{fontSize:13,color:T.text,fontWeight:500}}>{q.l} · {q.due}</div>
                          <div style={{fontSize:10,color:T.textMid,marginTop:1}}>
                            {q.past&&q.shortfall>0?(L==="vi"?"Đã quá hạn":"Past due"):q.shortfall===0?(L==="vi"?"Đã đủ":"Covered"):(L==="vi"?"Sắp đến hạn":"Upcoming")}
                          </div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:10,color:T.textDim,marginBottom:2}}>{L==="vi"?"Safe Harbor":L==="es"?"Safe Harbor":"Safe Harbor"}</div>
                          <div style={{fontSize:16,color:q.shortfall>0?T.green:T.textDim,fontWeight:600}}>{q.shortfall>0?fmt(q.shortfall):"✓"}</div>
                        </div>
                      </div>
                      {res.totalTax>0&&actualShortfall!==q.shortfall&&(
                        <div style={{padding:"8px 14px",background:T.bgCard2,borderTop:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <span style={{fontSize:10,color:T.textMid}}>{L==="vi"?"Ước tính thực tế (tránh bất ngờ khi khai thuế)":L==="es"?"Estimado real (evitar sorpresa al presentar)":"Actual estimate (avoid filing surprise)"}</span>
                          <span style={{fontSize:13,color:T.gold,fontWeight:600}}>{actualShortfall>0?fmt(actualShortfall):"✓"}</span>
                        </div>
                      )}
                    </div>
                  );
                })
            }
          </div>
          <div style={{marginTop:10,padding:"10px 14px",background:T.bgCard2,borderRadius:7,fontSize:12,color:T.textMid,lineHeight:1.6}}>
            💡 <strong style={{color:T.gold}}>irs.gov/payments</strong> → {L==="vi"?"chọn 'Estimated Tax'":L==="es"?"seleccione 'Estimated Tax'":"select 'Estimated Tax'"} → {L==="vi"?"nhập số tiền bạn chọn ở trên":L==="es"?"ingrese el monto que eligió":"enter whichever amount you choose above"}
          </div>
        </Card>

        <p style={{fontSize:10,color:T.textDim,textAlign:"center",lineHeight:1.6,marginTop:10}}>{TX.disc}</p>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:12}}>
          <Btn ghost small onClick={()=>{setStep(3);setRes(null);}}>{L==="vi"?"← Điều chỉnh":L==="es"?"← Ajustar":"← Adjust numbers"}</Btn>
          <Btn ghost small onClick={()=>{setStep(0);setRes(null);setInp({incomeType:"self",fs:"single",gross:"",expenses:"",w2income:"",w2wh:"",sideIncome:"",sideExpenses:"",rentalIncome:"",rentalExpenses:"",w2mixed:"",w2whMixed:"",selfMixed:"",selfExpMixed:"",rentalMixed:"",interestMixed:"",dividendsMixed:"",stcgMixed:"",ltcgMixed:"",skipCurrentYear:false,priorTax:"",priorAGI:"",unevenIncome:null,q1inc:"",q2inc:"",q3inc:"",q4inc:"",q1paid:"",q2paid:"",q3paid:"",q4paid:""});}}>{TX.again}</Btn>
        </div>
      </div>)}
    </div>
  );
}

function DepreciationCalc({lang:L="en"}){
  const [step,setStep]=useState(0);
  const [pdfLoading,setPdfLoading]=useState(false);
  const [pdfFlags,setPdfFlags]=useState([]);
  const [hasloan,setHasloan]=useState(true);
  const [inp,setInp]=useState({
    // A
    purchasePrice:"",
    // B — added to basis
    titleInsuranceLender:"",titleInsuranceOwner:"",titleSearch:"",otherTitleFees:"",
    settlementFee:"",recordingCharges:"",taxStamps:"",transferTaxes:"",
    attorneyFeesBasis:"",surveyFee:"",inspections:"",appraisalBasis:"",otherBasis:"",
    // B — POC (paid outside closing)
    pocAppraisal:"",pocInspection:"",pocOther:"",pocDestination:"Loan Cost (C)",
    // C — loan costs
    originationFee:"",discountPoints:"",appraisalLender:"",creditReport:"",
    mortgageInsurancePMI:"",assumptionFee:"",underwritingFee:"",attorneyFeeLoan:"",
    lenderOther:"",lenderCredit:"",
    // D — currently deductible
    propertyTaxClosing:"",prepaidInterest:"",insuranceMIP:"",proratedRent:"",
    // E — escrow/reserves
    escrowInsurance:"",escrowTax:"",escrowMortgageIns:"",aggregateAdj:"",
    // F — reductions
    earnestMoney:"",loanFunds:"",sellerCredit:"",taxAdjSeller:"",
    optionFee:"",proratedHOA:"",
    // Land
    landRatioMode:"assessed",landAssessed:"",totalAssessed:"",landRatioDirect:"",
    // Depreciation
    propType:"residential",alloc27:"",alloc39:"",alloc15:"",alloc7:"",alloc5:"",
    bonusDepreciation:true,bonusPct:"40",
    yearPlaced:new Date().getFullYear().toString(),monthPlaced:"1",
  });
  const [res,setRes]=useState(null);
  const s=(k,v)=>setInp(p=>({...p,[k]:v}));
  const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  // ── Derived ─────────────────────────────────────────────────────────
  // Section B — closing costs added to basis (on statement only)
  const basisCC=parse(inp.titleInsuranceLender)+parse(inp.titleInsuranceOwner)+
    parse(inp.titleSearch)+parse(inp.otherTitleFees)+parse(inp.settlementFee)+
    parse(inp.recordingCharges)+parse(inp.taxStamps)+parse(inp.transferTaxes)+
    parse(inp.attorneyFeesBasis)+parse(inp.surveyFee)+parse(inp.inspections)+
    parse(inp.appraisalBasis)+parse(inp.otherBasis);

  // POC items split by destination
  const pocLoanAmt=parse(inp.pocDestination==="Loan Cost (C)"?inp.pocAppraisal:0)+0;
  const pocBasisAmt=parse(inp.pocDestination==="Property Basis (B)"?inp.pocAppraisal:0)+
    parse(inp.pocInspection)+parse(inp.pocOther);
  // Simplified: user enters POC appraisal (usually loan cost)
  const pocLoan=parse(inp.pocAppraisal); // goes to loan cost
  const pocBasis=parse(inp.pocInspection)+parse(inp.pocOther); // goes to basis

  // Section C — loan costs (gross, no lender credit)
  const grossLoanCosts=hasloan?(parse(inp.originationFee)+parse(inp.discountPoints)+
    parse(inp.appraisalLender)+parse(inp.creditReport)+parse(inp.mortgageInsurancePMI)+
    parse(inp.assumptionFee)+parse(inp.underwritingFee)+parse(inp.attorneyFeeLoan)+
    parse(inp.lenderOther)):0;
  const lenderCreditAmt=parse(inp.lenderCredit);
  const netLoanCosts=Math.max(0,grossLoanCosts+pocLoan-lenderCreditAmt);

  // Section D — currently deductible
  const currentYearDeductible=parse(inp.propertyTaxClosing)+parse(inp.prepaidInterest)+
    parse(inp.insuranceMIP)+parse(inp.proratedRent);

  // Section E — escrow (not yet deductible)
  const escrowTotal=parse(inp.escrowInsurance)+parse(inp.escrowTax)+
    parse(inp.escrowMortgageIns)-parse(inp.aggregateAdj);

  // Section F — reductions to amount due
  const loanAmt=parse(inp.loanFunds);
  const earnestAmt=parse(inp.earnestMoney);
  const sellerCrAmt=parse(inp.sellerCredit);
  const taxAdjAmt=parse(inp.taxAdjSeller);
  const optionFeeAmt=parse(inp.optionFee);
  const proratedHOAAmt=parse(inp.proratedHOA);

  // Property Cost Basis = purchase + B + POC_basis - tax_adj - seller_cr - HOA_other
  const totalBasis=parse(inp.purchasePrice)+basisCC+pocBasis-taxAdjAmt-sellerCrAmt-proratedHOAAmt;

  // Cash-to-close reconciliation
  const totalCharges=parse(inp.purchasePrice)+basisCC+grossLoanCosts+
    parse(inp.propertyTaxClosing)+parse(inp.prepaidInterest)+
    parse(inp.insuranceMIP)+parse(inp.proratedRent)+
    Math.abs(escrowTotal);
  const totalReductions=earnestAmt+loanAmt+sellerCrAmt+lenderCreditAmt+
    taxAdjAmt+optionFeeAmt+proratedHOAAmt;
  const calcCashToClose=Math.max(0,totalCharges-totalReductions);

  // Land split
  const landRatio=inp.landRatioMode==="direct"
    ?Math.min(1,Math.max(0,parse(inp.landRatioDirect)/100))
    :(parse(inp.totalAssessed)>0?Math.min(1,parse(inp.landAssessed)/parse(inp.totalAssessed)):0);
  const landBasis=Math.round(totalBasis*landRatio);
  const buildingBasis=Math.max(0,totalBasis-landBasis);

  // Depreciation
  const bPct=parse(inp.bonusDepreciation?inp.bonusPct:0)/100;
  const mp=parseInt(inp.monthPlaced)||1;
  function calcDepr(basis,life,isReal,month){
    if(basis<=0)return{annual:0,bonus:0,firstYear:0,life};
    if(isReal){
      const annual=Math.round(basis/life*100)/100;
      const firstYear=Math.round(basis/life*(13-month)/12*100)/100;
      return{annual,bonus:0,firstYear,life};
    }
    // Personal/land: DB method with bonus
    const bonus=Math.round(basis*bPct*100)/100;
    const remaining=basis-bonus;
    const dbRate=life===15?1.5/life:2/life;
    const firstYearDB=Math.round(remaining*dbRate*0.5*100)/100;
    const annual=Math.round(remaining/life*100)/100;
    return{annual,bonus,firstYear:bonus+firstYearDB,life};
  }
  const allocTotal=parse(inp.alloc27)+parse(inp.alloc39)+parse(inp.alloc15)+parse(inp.alloc7)+parse(inp.alloc5);
  const classes=[
    {key:"alloc27",label:"Residential structure (27.5 yr)",
     basis:inp.propType==="residential"?parse(inp.alloc27)||Math.max(0,buildingBasis-parse(inp.alloc15)-parse(inp.alloc7)-parse(inp.alloc5)):0,
     life:27.5,isReal:true,color:"#4a9060",show:inp.propType==="residential"},
    {key:"alloc39",label:"Non-residential structure (39 yr)",
     basis:inp.propType==="nonresidential"?parse(inp.alloc39)||Math.max(0,buildingBasis-parse(inp.alloc15)-parse(inp.alloc7)-parse(inp.alloc5)):0,
     life:39,isReal:true,color:"#4a6fa8",show:inp.propType==="nonresidential"},
    {key:"alloc15",label:"Land improvements (15 yr)",basis:parse(inp.alloc15),life:15,isReal:false,color:"#9a7a60",show:true},
    {key:"alloc7",label:"Furniture/equipment (7 yr)",basis:parse(inp.alloc7),life:7,isReal:false,color:"#7a6a9a",show:true},
    {key:"alloc5",label:"Appliances/fixtures (5 yr)",basis:parse(inp.alloc5),life:5,isReal:false,color:"#c8a96e",show:true},
  ].filter(c=>c.show&&c.basis>0);
  const classResults=classes.map(c=>({...c,...calcDepr(c.basis,c.life,c.isReal,mp)}));
  const totalAnnual=classResults.reduce((a,c)=>a+c.annual,0);
  const totalFirstYear=classResults.reduce((a,c)=>a+c.firstYear,0);
  const totalBonus=classResults.reduce((a,c)=>a+c.bonus,0);

  // ── PDF handler ─────────────────────────────────────────────────────
  async function handlePDF(e){
    const file=e.target.files[0]; if(!file)return;
    setPdfLoading(true); setPdfFlags([]);
    try{
      const base64=await new Promise((res,rej)=>{
        const r=new FileReader();
        r.onload=()=>res(r.result.split(",")[1]);
        r.onerror=rej;
        r.readAsDataURL(file);
      });
      const prompt=`You are a CPA analyzing a real estate closing statement. Extract every line item per IRS rules. Return ONLY valid JSON with these exact keys (use null if not found, numbers only no $ signs):
{"documentType":"HUD-1","hasloan":true,"purchasePrice":null,"sectionB":{"titleInsuranceLender":null,"titleInsuranceOwner":null,"titleSearch":null,"otherTitleFees":null,"settlementFee":null,"recordingCharges":null,"taxStamps":null,"transferTaxes":null,"attorneyFeesBasis":null,"surveyFee":null,"inspections":null,"appraisalBasis":null,"otherBasis":null},"sectionC":{"originationFee":null,"discountPoints":null,"appraisalLender":null,"creditReport":null,"mortgageInsurancePMI":null,"assumptionFee":null,"underwritingFee":null,"attorneyFeeLoan":null,"lenderOther":null,"lenderCredit":null},"sectionD":{"propertyTaxClosing":null,"prepaidInterest":null,"insuranceMIP":null,"proratedRent":null},"sectionE":{"escrowInsurance":null,"escrowTax":null,"escrowMortgageIns":null,"aggregateAdj":null},"sectionF":{"earnestMoney":null,"loanFunds":null,"sellerCredit":null,"taxAdjSeller":null,"optionFee":null,"proratedHOA":null},"poc":{"pocAppraisal":null},"flags":[]}`;
      const response=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "anthropic-dangerous-direct-browser-access":"true"
        },
        body:JSON.stringify({
          model:"claude-sonnet-4-6",
          max_tokens:2000,
          messages:[{role:"user",content:[
            {type:"document",source:{type:"base64",media_type:"application/pdf",data:base64}},
            {type:"text",text:prompt}
          ]}]
        })
      });
      if(!response.ok) throw new Error("API error "+response.status);
      const data=await response.json();
      if(data.error) throw new Error(data.error.message||"API error");
      const text=data.content.map(i=>i.text||"").join("").replace(/```json|```/g,"").trim();
      const d=JSON.parse(text);
      setHasloan(d.hasloan!==false);
      if(d.purchasePrice) s("purchasePrice",String(d.purchasePrice));
      ["sectionB","sectionC","sectionD","sectionE","sectionF"].forEach(sec=>{
        const obj=d[sec]||{};
        Object.entries(obj).forEach(([k,v])=>{if(v!=null&&v!==0) s(k,String(v));});
      });
      if(d.poc?.pocAppraisal) s("pocAppraisal",String(d.poc.pocAppraisal));
      setPdfFlags((d.flags||[]).length>0?d.flags:["PDF read successfully — review fields below and correct any errors."]);
    }catch(err){
      console.error("PDF error:",err);
      const msg=err.message||String(err);
      setPdfFlags([
        "PDF upload failed: "+msg,
        "Please enter values manually in the fields below.",
        "If this keeps happening, try a smaller PDF or take a screenshot of each page."
      ]);
    }
    setPdfLoading(false);
  }

  // ── Mini components ─────────────────────────────────────────────────
  function SRow({label,value,color,bold,indent,note}){
    if(!value||value==="$0"||value==="-")return null;
    return(
      <tr>
        <td style={{padding:"4px 0",color:bold?T.gold:T.textMid,fontWeight:bold?700:400,
          fontSize:bold?13:11,paddingLeft:indent?14:0,lineHeight:1.3}}>{label}
          {note&&<span style={{fontSize:9,color:T.textDim,marginLeft:6,fontStyle:"italic"}}>{note}</span>}
        </td>
        <td style={{padding:"4px 0",textAlign:"right",color:color||T.text,
          fontWeight:bold?700:400,fontSize:bold?13:11}}>{value}</td>
      </tr>
    );
  }
  function Div(){return<tr><td colSpan={2}><div style={{borderTop:"1px solid "+T.border,margin:"4px 0"}}/></td></tr>;}
  function SecHdr({text,color,bg}){
    return<div style={{padding:"8px 12px 6px",background:bg||"rgba(0,0,0,0.3)",
      borderLeft:"3px solid "+(color||T.gold),marginBottom:8,marginTop:4}}>
      <p style={{margin:0,fontSize:9,fontWeight:700,letterSpacing:"0.1em",
        textTransform:"uppercase",color:color||T.gold}}>{text}</p>
    </div>;
  }
  function MF({label,field,hint,credit,income,inp:mfInp,s:mfS}){
    const isCredit=credit||income;
    return(
      <div style={{marginBottom:10}}>
        <div style={{fontSize:11,color:isCredit?T.amber:T.textMid,marginBottom:3,
          fontWeight:isCredit?600:400,lineHeight:1.3}}>
          {label}
          {credit&&<span style={{fontSize:9,color:T.amber,marginLeft:4,display:"inline-block"}}>← reduces basis</span>}
          {income&&<span style={{fontSize:9,color:T.red,marginLeft:4,display:"inline-block"}}>← taxable income</span>}
        </div>
        {hint&&<div style={{fontSize:9,color:T.textDim,marginBottom:4,fontStyle:"italic",lineHeight:1.4}}>{hint}</div>}
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",
            color:T.goldDim,fontSize:15,pointerEvents:"none",userSelect:"none"}}>$</span>
          <input
            type="text"
            inputMode="decimal"
            value={mfInp[field]}
            onChange={e=>mfS(field,e.target.value)}
            placeholder="0.00"
            style={{width:"100%",background:"#0a0c0f",
              border:"2px solid "+(isCredit?T.amber+"60":T.border),
              borderRadius:8,padding:"12px 14px 12px 28px",fontSize:16,color:T.text,
              fontFamily:"inherit",outline:"none",
              boxSizing:"border-box",WebkitAppearance:"none"}}/>
        </div>
      </div>
    );
  }
  function SB({color,tc,title,children}){
    return<div style={{marginBottom:10,border:"1px solid "+(color||T.border)+"40",borderRadius:8,overflow:"hidden"}}>
      <div style={{padding:"8px 12px",background:color||T.border,opacity:0.9}}>
        <p style={{margin:0,fontSize:9,fontWeight:700,letterSpacing:"0.08em",
          textTransform:"uppercase",color:tc||T.white}}>{title}</p>
      </div>
      <div style={{padding:"12px 12px 8px",background:T.bgCard2}}>{children}</div>
    </div>;
  }

  const steps=["Closing","Land","Classes","Results"];
  const canGo0=parse(inp.purchasePrice)>0;
  const canGo1=landRatio>0&&landRatio<1;
  const canGo2=buildingBasis>0;

  function calculate(){
    setRes({totalBasis,basisCC,pocBasis,pocLoan,grossLoanCosts,netLoanCosts,lenderCreditAmt,
      currentYearDeductible,escrowTotal,calcCashToClose,totalCharges,
      landBasis,buildingBasis,landRatio,classResults,totalAnnual,totalFirstYear,
      totalBonus,inp,hasloan,sellerCrAmt,taxAdjAmt,proratedHOAAmt});
    setStep(3);
  }
  function resetAll(){setStep(0);setRes(null);setPdfFlags([]);setHasloan(true);
    setInp({purchasePrice:"",titleInsuranceLender:"",titleInsuranceOwner:"",titleSearch:"",otherTitleFees:"",settlementFee:"",recordingCharges:"",taxStamps:"",transferTaxes:"",attorneyFeesBasis:"",surveyFee:"",inspections:"",appraisalBasis:"",otherBasis:"",pocAppraisal:"",pocInspection:"",pocOther:"",pocDestination:"Loan Cost (C)",originationFee:"",discountPoints:"",appraisalLender:"",creditReport:"",mortgageInsurancePMI:"",assumptionFee:"",underwritingFee:"",attorneyFeeLoan:"",lenderOther:"",lenderCredit:"",propertyTaxClosing:"",prepaidInterest:"",insuranceMIP:"",proratedRent:"",escrowInsurance:"",escrowTax:"",escrowMortgageIns:"",aggregateAdj:"",earnestMoney:"",loanFunds:"",sellerCredit:"",taxAdjSeller:"",optionFee:"",proratedHOA:"",landRatioMode:"assessed",landAssessed:"",totalAssessed:"",landRatioDirect:"",propType:"residential",alloc27:"",alloc39:"",alloc15:"",alloc7:"",alloc5:"",bonusDepreciation:true,bonusPct:"40",yearPlaced:new Date().getFullYear().toString(),monthPlaced:"1"});
  }

  return(
    <div>
      <div style={{marginBottom:14}}>
        <h3 style={{margin:"0 0 4px",fontSize:15,fontWeight:400,color:T.gold}}>
          {L==="vi"?"Phân Tích Hợp Đồng & Khấu Hao":L==="es"?"Análisis de Cierre y Depreciación":"Closing Statement Analysis & Depreciation"}
        </h3>
        <p style={{margin:0,fontSize:12,color:T.textDim}}>{"HUD-1/CD basis calculation • Cash-to-close reconciliation • Depreciation schedule"}</p>
      </div>

      {/* Progress */}
      <div style={{display:"flex",gap:5,marginBottom:18}}>
        {steps.map((st,i)=>{const a=i===step,d=i<step;return(
          <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
            <div style={{height:2,width:"100%",borderRadius:1,background:d||a?T.gold:T.border}}/>
            <span style={{fontSize:8,letterSpacing:"0.06em",textTransform:"uppercase",textAlign:"center",
              color:a?T.gold:d?T.goldDim:T.textDim,lineHeight:1.3}}>{st}</span>
          </div>
        );})}
      </div>

      {/* ── STEP 0 — Closing Statement ── */}
      {step===0&&(<div>

        {/* PDF Upload */}
        <Card>
          <CardTitle>{"Upload Closing Statement (Optional)"}</CardTitle>
          <CardSub>{"HUD-1 or Closing Disclosure — auto-fills all fields below"}</CardSub>
          <div style={{padding:"14px",background:T.bgCard2,border:"2px dashed "+(pdfLoading?T.gold:T.border),
            borderRadius:8,textAlign:"center",marginBottom:10}}>
            <div style={{fontSize:22,marginBottom:6}}>{pdfLoading?"🤖":"📄"}</div>
            <p style={{fontSize:12,color:T.textMid,margin:"0 0 8px"}}>{pdfLoading?"Reading every line item...":"Upload to auto-fill"}</p>
            {!pdfLoading&&(<label style={{display:"inline-block",padding:"7px 16px",borderRadius:6,fontSize:12,fontFamily:"inherit",cursor:"pointer",fontWeight:600,background:"linear-gradient(135deg,"+T.gold+","+T.goldLight+")",color:"#050608"}}>
              Choose PDF<input type="file" accept=".pdf" onChange={handlePDF} style={{display:"none"}}/>
            </label>)}
          </div>
          {pdfFlags.length>0&&<div style={{display:"flex",flexDirection:"column",gap:4}}>
            {pdfFlags.map((f,i)=><div key={i} style={{fontSize:11,color:T.textMid,padding:"4px 10px",
              background:T.bgCard2,borderRadius:4}}>📝 {f}</div>)}
          </div>}
        </Card>

        <div style={{marginBottom:10,padding:"10px 14px",background:T.bgCard2,border:"1px solid "+T.border,borderRadius:8}}>
          <Toggle value={hasloan} onChange={setHasloan} label={"Has Mortgage / Loan"} desc={"Turn off for cash purchases"}/>
        </div>

        {/* A — Purchase Price */}
        <SB color="#2a5a3a" tc="#90d4a0" title="A — Purchase Price">
          <MF label={"Purchase price (from sales contract / HUD-1 Line 101)"} field="purchasePrice" inp={inp} s={s}/>
        </SB>

        {/* B — Added to Basis */}
        <SB color="#2a3a6a" tc="#90b0f0" title="B — HUD-1 Expenses Added to Property Cost Basis (capitalized — NOT immediately deductible)">
          <div style={{display:"grid",gridTemplateColumns:"1fr",gap:0}}>
            <MF label={"Title Insurance — Lender's Policy"} field="titleInsuranceLender" hint="HUD-1 line 1101" inp={inp} s={s}/>
            <MF label={"Title Insurance — Owner's Policy"} field="titleInsuranceOwner" hint="HUD-1 line 1103" inp={inp} s={s}/>
            <MF label={"Title Search / Abstract / Title Exam"} field="titleSearch" hint="HUD-1 line 1102" inp={inp} s={s}/>
            <MF label={"Other Title Fees"} field="otherTitleFees" hint="Endorsements, binder, etc." inp={inp} s={s}/>
            <MF label={"Settlement / Closing Fee"} field="settlementFee" hint="HUD-1 line 1100" inp={inp} s={s}/>
            <MF label={"Gov't Recording Charges"} field="recordingCharges" hint="HUD-1 line 1201" inp={inp} s={s}/>
            <MF label={"State/City/County Tax Stamps"} field="taxStamps" hint="HUD-1 line 1202" inp={inp} s={s}/>
            <MF label={"Transfer Taxes"} field="transferTaxes" hint="HUD-1 line 1203" inp={inp} s={s}/>
            <MF label={"Attorney Fees (title-related, not loan)"} field="attorneyFeesBasis" inp={inp} s={s}/>
            <MF label={"Survey Fee"} field="surveyFee" hint="HUD-1 line 1301" inp={inp} s={s}/>
            <MF label={"Inspections (not required by lender)"} field="inspections" hint="HUD-1 lines 1302–1305" inp={inp} s={s}/>
            <MF label={"Appraisal (NOT required by lender)"} field="appraisalBasis" hint="Buyer's choice — adds to basis" inp={inp} s={s}/>
            <MF label={"Other Closing Costs"} field="otherBasis" hint="Home warranty, buyer agent commission, etc." inp={inp} s={s}/>
          </div>
          {basisCC>0&&<div style={{marginTop:8,padding:"6px 10px",background:"rgba(74,111,168,0.1)",borderRadius:5,fontSize:12,color:"#6a8ac0"}}>
            Total Section B: <strong>{fmt(basisCC)}</strong>
          </div>}
        </SB>

        {/* B — POC */}
        <SB color="#4a4a1a" tc="#d4c840" title="Paid Outside Closing (POC) — add to Loan Cost or Basis">
          <p style={{fontSize:10,color:T.textDim,margin:"0 0 8px",fontStyle:"italic"}}>{"Items paid before/outside closing. Does NOT affect cash-to-close reconciliation."}</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr",gap:0}}>
            <MF label={"Appraisal (required by lender — paid POC)"} field="pocAppraisal" hint="Usually goes to Loan Cost" inp={inp} s={s}/>
            <MF label={"Inspection (paid outside closing)"} field="pocInspection" hint="Goes to Property Basis" inp={inp} s={s}/>
            <MF label={"Other POC item"} field="pocOther" hint="Goes to Property Basis" inp={inp} s={s}/>
          </div>
          {(pocLoan+pocBasis)>0&&<div style={{marginTop:8,fontSize:11,color:"#a0a020"}}>
            POC → Loan Cost: <strong>{fmt(pocLoan)}</strong> · POC → Basis: <strong>{fmt(pocBasis)}</strong>
          </div>}
        </SB>

        {/* C — Loan Costs */}
        {hasloan&&<SB color="#5a3a6a" tc="#c090d8" title="C — HUD-1 Expenses — Loan Cost Basis (amortize over loan term)">
          <div style={{display:"grid",gridTemplateColumns:"1fr",gap:0}}>
            <MF label={"Loan Origination Fee"} field="originationFee" hint="HUD-1 line 801" inp={inp} s={s}/>
            <MF label={"Loan Discount / Points"} field="discountPoints" hint="HUD-1 line 802" inp={inp} s={s}/>
            <MF label={"Appraisal (Required by Lender)"} field="appraisalLender" hint="On statement only — not POC" inp={inp} s={s}/>
            <MF label={"Credit Report"} field="creditReport" hint="HUD-1 line 804" inp={inp} s={s}/>
            <MF label={"Mortgage Insurance PMI (financed into loan)"} field="mortgageInsurancePMI" hint="Not upfront MIP — see Section D" inp={inp} s={s}/>
            <MF label={"Assumption / Application Fee"} field="assumptionFee" inp={inp} s={s}/>
            <MF label={"Underwriting Fee"} field="underwritingFee" hint="HUD-1 line 808" inp={inp} s={s}/>
            <MF label={"Attorney Fees (under loan section)"} field="attorneyFeeLoan" hint="Loan-related attorney work" inp={inp} s={s}/>
            <MF label={"Lender Other Charges"} field="lenderOther" inp={inp} s={s}/>
          </div>
          <div style={{borderTop:"1px solid "+T.border,marginTop:10,paddingTop:10}}>
            <MF label={"Lender Credit to Buyer → Enter as POSITIVE"} field="lenderCredit"
              hint="Reduces loan cost basis and reduces cash to close" inp={inp} s={s}/>
          </div>
          {grossLoanCosts>0&&<div style={{marginTop:8,fontSize:11,color:"#b080d8"}}>
            HUD-1 loan costs: <strong>{fmt(grossLoanCosts)}</strong>
            {lenderCreditAmt>0&&<> · Lender credit: <strong>({fmt(lenderCreditAmt)})</strong></>}
            {" · "}Net loan cost basis: <strong style={{color:T.gold}}>{fmt(netLoanCosts)}</strong>
          </div>}
        </SB>}

        {/* D — Currently Deductible */}
        <SB color="#1a4a3a" tc="#70d0a0" title="D — HUD-1 Expenses Currently Deductible (deduct in year of closing)">
          <div style={{display:"grid",gridTemplateColumns:"1fr",gap:0}}>
            <MF label={"Property Taxes Paid at Closing ← DEDUCTIBLE"} field="propertyTaxClosing" hint="Schedule E line 16" inp={inp} s={s}/>
            <MF label={"Prepaid Mortgage Interest ← DEDUCTIBLE"} field="prepaidInterest" hint="Closing date to month-end · Schedule E" inp={inp} s={s}/>
            <MF label={"Homeowners Insurance + Upfront MIP/PMI ← DEDUCTIBLE"} field="insuranceMIP" hint="Full premium deductible (cash basis · IRS Rev. Rul. 2007-3)" inp={inp} s={s}/>
            <MF label={"Prorated Rent from Seller → TAXABLE INCOME"} field="proratedRent" hint="Report on Schedule E · enter positive" income inp={inp} s={s}/>
          </div>
          {currentYearDeductible>0&&<div style={{marginTop:8,padding:"6px 10px",background:"rgba(74,144,96,0.08)",borderRadius:5,fontSize:12,color:T.green}}>
            Currently deductible: <strong>{fmt(parse(inp.propertyTaxClosing)+parse(inp.prepaidInterest)+parse(inp.insuranceMIP))}</strong>
            {parse(inp.proratedRent)>0&&<> · Taxable income: <strong style={{color:T.red}}>{fmt(parse(inp.proratedRent))}</strong></>}
          </div>}
        </SB>

        {/* E — Reserves */}
        <SB color="#3a2a5a" tc="#a080c8" title="E — Reserves and Deposits (escrow — deductible only when paid out)">
          <div style={{display:"grid",gridTemplateColumns:"1fr",gap:0}}>
            <MF label={"Deposit with Lender — Homeowners Insurance"} field="escrowInsurance" inp={inp} s={s}/>
            <MF label={"Deposit with Lender — Property Tax"} field="escrowTax" inp={inp} s={s}/>
            <MF label={"Deposit with Lender — Mortgage Insurance"} field="escrowMortgageIns" inp={inp} s={s}/>
            <MF label={"Aggregate Adjustment Credit → Enter as POSITIVE"} field="aggregateAdj"
              hint="Lender credit to prevent escrow overfunding — reduces cash to close" inp={inp} s={s}/>
          </div>
        </SB>

        {/* F — Reductions */}
        <SB color="#5a2a1a" tc="#e09060" title="F — Reductions to Amount Due (all enter as POSITIVE)">
          <div style={{display:"grid",gridTemplateColumns:"1fr",gap:0}}>
            <MF label={"Earnest Money Deposit"} field="earnestMoney" hint="Cash paid by buyer — no basis effect" inp={inp} s={s}/>
            <MF label={"Loan Funds (Mortgage Amount)"} field="loanFunds" hint="From lender" inp={inp} s={s}/>
            <MF label={"Seller Credit / Concession"} field="sellerCredit" hint="Reduces basis" credit inp={inp} s={s}/>
            <MF label={"Tax Adjustment Unpaid by Seller"} field="taxAdjSeller" hint="Reduces basis + reduces cash to close" credit inp={inp} s={s}/>
            <MF label={"Option Fee / Option Period Credit"} field="optionFee" hint="Buyer's own cash — reduces cash to close only" inp={inp} s={s}/>
            <MF label={"Prorated HOA / Other Credits"} field="proratedHOA" hint="Reduces basis" credit inp={inp} s={s}/>
          </div>
        </SB>

        {/* Live reconciliation */}
        {parse(inp.purchasePrice)>0&&(
          <div style={{background:"linear-gradient(135deg,#0a1a0e,#080e0a)",border:"1px solid #1a4020",
            borderRadius:10,padding:"14px 16px",marginBottom:14}}>
            <p style={{fontSize:10,color:T.green,margin:"0 0 10px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase"}}>
              {"HUD-1 Reconciliation — Due from Borrower (Line 303)"}
            </p>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
              <tbody>
                <tr><td colSpan={2} style={{fontSize:9,color:"#4a8070",padding:"2px 0 4px",fontWeight:600,textTransform:"uppercase"}}>{"Charges to Borrower"}</td></tr>
                <SRow label={"Purchase price"} value={fmt(parse(inp.purchasePrice))}/>
                {basisCC>0&&<SRow label={"+ HUD-1 closing costs — basis (B)"} value={fmt(basisCC)} color="#6a8fc0" indent/>}
                {hasloan&&grossLoanCosts>0&&<SRow label={"+ HUD-1 loan costs — gross (C)"} value={fmt(grossLoanCosts)} color="#a080c0" indent/>}
                {currentYearDeductible>0&&<SRow label={"+ Currently deductible prepaids (D)"} value={fmt(parse(inp.propertyTaxClosing)+parse(inp.prepaidInterest)+parse(inp.insuranceMIP))} color={T.green} indent/>}
                {escrowTotal>0&&<SRow label={"+ Reserves/escrow (E)"} value={fmt(escrowTotal)} indent/>}
                <Div/>
                <SRow label={"Gross amount due from borrower"} value={fmt(totalCharges)} bold/>
                <Div/>
                <tr><td colSpan={2} style={{fontSize:9,color:"#4a8070",padding:"6px 0 4px",fontWeight:600,textTransform:"uppercase"}}>{"Reductions to Amount Due"}</td></tr>
                {earnestAmt>0&&<SRow label={"− Earnest money"} value={"("+fmt(earnestAmt)+")"} color={T.green} indent/>}
                {loanAmt>0&&<SRow label={"− Loan funds"} value={"("+fmt(loanAmt)+")"} color={T.green} indent/>}
                {sellerCrAmt>0&&<SRow label={"− Seller credit"} value={"("+fmt(sellerCrAmt)+")"} color={T.green} indent note="reduces basis"/>}
                {lenderCreditAmt>0&&<SRow label={"− Lender credit"} value={"("+fmt(lenderCreditAmt)+")"} color={T.green} indent/>}
                {taxAdjAmt>0&&<SRow label={"− Tax adjustment (seller)"} value={"("+fmt(taxAdjAmt)+")"} color={T.green} indent note="reduces basis"/>}
                {optionFeeAmt>0&&<SRow label={"− Option fee"} value={"("+fmt(optionFeeAmt)+")"} color={T.green} indent/>}
                {proratedHOAAmt>0&&<SRow label={"− Prorated HOA / other"} value={"("+fmt(proratedHOAAmt)+")"} color={T.green} indent note="reduces basis"/>}
                {parse(inp.aggregateAdj)>0&&<SRow label={"− Aggregate adjustment (E)"} value={"("+fmt(parse(inp.aggregateAdj))+")"} color={T.green} indent/>}
                <Div/>
                <SRow label={"Cash due from borrower (Line 303)"} value={fmt(calcCashToClose)} bold color={T.gold}/>
              </tbody>
            </table>
          </div>
        )}

        {/* Basis & Loan Cost Summary */}
        {totalBasis>0&&(
          <div style={{background:T.bgCard2,border:"1px solid "+T.border,borderRadius:10,padding:"14px 16px",marginBottom:14}}>
            <p style={{fontSize:10,color:T.gold,margin:"0 0 10px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase"}}>{"Property Cost Basis & Loan Cost Summary"}</p>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
              <tbody>
                <tr><td colSpan={2} style={{fontSize:9,color:"#6a8fc0",padding:"2px 0 4px",fontWeight:600,textTransform:"uppercase"}}>{"Property Cost Basis"}</td></tr>
                <SRow label={"Purchase price"} value={fmt(parse(inp.purchasePrice))}/>
                {basisCC>0&&<SRow label={"+ HUD-1 Closing Costs (B)"} value={fmt(basisCC)} color="#6a8fc0" indent/>}
                {pocBasis>0&&<SRow label={"+ Paid Outside Closing — Basis"} value={fmt(pocBasis)} color="#6a8fc0" indent/>}
                {taxAdjAmt>0&&<SRow label={"− Tax Adjustment Unpaid by Seller"} value={"("+fmt(taxAdjAmt)+")"} color={T.amber} indent/>}
                {sellerCrAmt>0&&<SRow label={"− Seller Credit"} value={"("+fmt(sellerCrAmt)+")"} color={T.amber} indent/>}
                {proratedHOAAmt>0&&<SRow label={"− Prorated HOA / Other Credits"} value={"("+fmt(proratedHOAAmt)+")"} color={T.amber} indent/>}
                <SRow label={"PROPERTY COST BASIS"} value={fmt(totalBasis)} bold color={T.gold}/>
                <Div/>
                {hasloan&&netLoanCosts>0&&(<>
                  <tr><td colSpan={2} style={{fontSize:9,color:"#a080c0",padding:"6px 0 4px",fontWeight:600,textTransform:"uppercase"}}>{"Loan Cost Basis (amortize over loan term)"}</td></tr>
                  <SRow label={"HUD-1 loan costs (C)"} value={fmt(grossLoanCosts)} indent/>
                  {pocLoan>0&&<SRow label={"+ POC loan costs"} value={fmt(pocLoan)} color="#6a8fc0" indent/>}
                  {lenderCreditAmt>0&&<SRow label={"− Lender credit"} value={"("+fmt(lenderCreditAmt)+")"} color={T.green} indent/>}
                  <SRow label={"NET LOAN COST BASIS"} value={fmt(netLoanCosts)} bold color={T.gold}/>
                </>)}
                {currentYearDeductible>0&&(<>
                  <Div/>
                  <tr><td colSpan={2} style={{fontSize:9,color:T.green,padding:"6px 0 4px",fontWeight:600,textTransform:"uppercase"}}>{"Currently Deductible This Year"}</td></tr>
                  {parse(inp.propertyTaxClosing)>0&&<SRow label={"Property taxes paid"} value={fmt(parse(inp.propertyTaxClosing))} color={T.green} indent/>}
                  {parse(inp.prepaidInterest)>0&&<SRow label={"Prepaid interest"} value={fmt(parse(inp.prepaidInterest))} color={T.green} indent/>}
                  {parse(inp.insuranceMIP)>0&&<SRow label={"Insurance + MIP/PMI"} value={fmt(parse(inp.insuranceMIP))} color={T.green} indent/>}
                  <SRow label={"TOTAL DEDUCTIBLE"} value={fmt(parse(inp.propertyTaxClosing)+parse(inp.prepaidInterest)+parse(inp.insuranceMIP))} bold color={T.green}/>
                </>)}
                {parse(inp.proratedRent)>0&&(<>
                  <Div/>
                  <SRow label={"⚠ Prorated rent received (taxable — Schedule E)"} value={fmt(parse(inp.proratedRent))} color={T.red}/>
                </>)}
              </tbody>
            </table>
          </div>
        )}

        <NavRow><div/><Btn onClick={()=>setStep(1)} disabled={!canGo0}>{"Next →"}</Btn></NavRow>
      </div>)}

      {/* ── STEP 1 — Land ── */}
      {step===1&&(<Card>
        <CardTitle>{"Land vs Building Split"}</CardTitle>
        <CardSub>{"Land is not depreciable. Find values at county assessor or Realtor.com → Property Details → Tax History"}</CardSub>
        <div style={{display:"grid",gridTemplateColumns:"1fr",gap:0,margin:"12px 0"}}>
          {[{v:"assessed",l:"Enter Assessed Values",d:"Land + total → ratio calculated"},
            {v:"direct",l:"Enter % Directly",d:"You already know the land %"}].map(o=>(
            <button key={o.v} onClick={()=>s("landRatioMode",o.v)}
              style={{padding:"10px",borderRadius:7,cursor:"pointer",fontFamily:"inherit",textAlign:"left",
                background:inp.landRatioMode===o.v?"rgba(200,169,110,0.12)":T.bgCard,
                border:"1px solid "+(inp.landRatioMode===o.v?T.gold:T.border)}}>
              <div style={{fontSize:12,color:inp.landRatioMode===o.v?T.gold:T.text,fontWeight:500,marginBottom:2}}>{o.l}</div>
              <div style={{fontSize:10,color:T.textDim}}>{o.d}</div>
            </button>
          ))}
        </div>
        {inp.landRatioMode==="assessed"&&(<>
          <Fld label={"Assessed land value"} hint={"From county assessor or Realtor.com Tax History"}><Inp value={inp.landAssessed} onChange={v=>s("landAssessed",v)} placeholder="0" prefix="$"/></Fld>
          <Fld label={"Total assessed value (land + building)"}><Inp value={inp.totalAssessed} onChange={v=>s("totalAssessed",v)} placeholder="0" prefix="$"/></Fld>
        </>)}
        {inp.landRatioMode==="direct"&&(
          <Fld label={"Land percentage (%)"} hint={"Enter 25 if land = 25% of total value"}><Inp value={inp.landRatioDirect} onChange={v=>s("landRatioDirect",v)} placeholder="25"/></Fld>
        )}
        {landRatio>0&&<IBox tone="green">Land: <strong>{(landRatio*100).toFixed(1)}%</strong> ({fmt(landBasis)}) · Building: <strong style={{color:T.gold}}>{fmt(buildingBasis)}</strong></IBox>}
        <NavRow><Btn ghost onClick={()=>setStep(0)}>{"← Back"}</Btn><Btn onClick={()=>setStep(2)} disabled={!canGo1}>{"Next →"}</Btn></NavRow>
      </Card>)}

      {/* ── STEP 2 — Asset Classes ── */}
      {step===2&&(<Card>
        <CardTitle>{"Asset Class Allocation"}</CardTitle>
        <CardSub>{"Shorter-lived components depreciate faster. 5/7/15yr assets qualify for bonus depreciation and 200%/150% DB method."}</CardSub>
        <Fld label={"Property type"}>
          <div style={{display:"grid",gridTemplateColumns:"1fr",gap:0}}>
            {[{v:"residential",l:"Residential rental — 27.5 yr"},{v:"nonresidential",l:"Non-residential — 39 yr"}].map(o=>(
              <button key={o.v} onClick={()=>s("propType",o.v)}
                style={{padding:"9px 8px",borderRadius:7,cursor:"pointer",fontFamily:"inherit",fontSize:11,textAlign:"center",
                  background:inp.propType===o.v?"rgba(200,169,110,0.12)":T.bgCard,
                  border:"1px solid "+(inp.propType===o.v?T.gold:T.border),color:inp.propType===o.v?T.gold:T.textMid}}>
                {o.l}
              </button>
            ))}
          </div>
        </Fld>
        <div style={{padding:"12px 14px",background:T.bgCard2,border:"1px solid "+T.border,borderRadius:8,marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <span style={{fontSize:10,color:T.gold,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>{"Building Basis Allocation"}</span>
            <span style={{fontSize:11,color:allocTotal>buildingBasis?T.red:T.textMid}}>{fmt(allocTotal)} / {fmt(buildingBasis)}</span>
          </div>
          {inp.propType==="residential"&&<Fld label={"Residential structure — 27.5 yr (SL)"} hint={"Walls, roof, electrical, plumbing, HVAC — leave blank = auto"}>
            <Inp value={inp.alloc27} onChange={v=>s("alloc27",v)} placeholder={fmt(Math.max(0,buildingBasis-parse(inp.alloc15)-parse(inp.alloc7)-parse(inp.alloc5)))} prefix="$"/></Fld>}
          {inp.propType==="nonresidential"&&<Fld label={"Non-residential — 39 yr (SL)"} hint={"Leave blank = auto"}>
            <Inp value={inp.alloc39} onChange={v=>s("alloc39",v)} placeholder={fmt(Math.max(0,buildingBasis-parse(inp.alloc15)-parse(inp.alloc7)-parse(inp.alloc5)))} prefix="$"/></Fld>}
          <Fld label={"Land improvements — 15 yr (150% DB)"} optional optLbl="optional" hint="Fencing, paving, landscaping, irrigation"><Inp value={inp.alloc15} onChange={v=>s("alloc15",v)} placeholder="0" prefix="$"/></Fld>
          <Fld label={"Furniture/equipment — 7 yr (200% DB)"} optional optLbl="optional"><Inp value={inp.alloc7} onChange={v=>s("alloc7",v)} placeholder="0" prefix="$"/></Fld>
          <Fld label={"Appliances/carpet/fixtures — 5 yr (200% DB)"} optional optLbl="optional" hint="Refrigerator, stove, carpet, ceiling fans"><Inp value={inp.alloc5} onChange={v=>s("alloc5",v)} placeholder="0" prefix="$"/></Fld>
          {allocTotal>buildingBasis&&<IBox tone="red">⚠ Total exceeds building basis: {fmt(buildingBasis)}</IBox>}
        </div>
        <div style={{padding:"12px 14px",background:T.bgCard2,border:"1px solid "+T.border,borderRadius:8,marginBottom:10}}>
          <Toggle value={inp.bonusDepreciation} onChange={v=>s("bonusDepreciation",v)}
            label={"Bonus Depreciation (5/7/15 yr only — NOT real property)"}
            desc={"2024: 60%  ·  2025: 40%  ·  2026: 20%  ·  Real property (27.5/39 yr) = always 0%"}/>
          {inp.bonusDepreciation&&<Fld label={"Bonus rate %"}><Inp value={inp.bonusPct} onChange={v=>s("bonusPct",v)} placeholder="40"/></Fld>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Fld label={"Year placed in service"}><Inp value={inp.yearPlaced} onChange={v=>s("yearPlaced",v)} placeholder={new Date().getFullYear().toString()}/></Fld>
          <Fld label={"Month placed in service"} hint={"Affects Year 1 real property depr"}><Sel value={inp.monthPlaced} onChange={v=>s("monthPlaced",v)} options={months.map((m,i)=>({value:String(i+1),label:m}))}/></Fld>
        </div>
        <NavRow><Btn ghost onClick={()=>setStep(1)}>{"← Back"}</Btn><Btn onClick={calculate} disabled={!canGo2}>{"Calculate Depreciation"}</Btn></NavRow>
      </Card>)}

      {/* ── STEP 3 — Results ── */}
      {step===3&&res&&(<div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          <div style={{background:"linear-gradient(135deg,#0d1a08,#0a1205)",border:"1px solid #1a4020",borderRadius:10,padding:"16px 14px"}}>
            <div style={{fontSize:9,letterSpacing:"0.2em",textTransform:"uppercase",color:"#2a6030",marginBottom:6}}>{"Year 1 Depreciation"}</div>
            <div style={{fontSize:"clamp(26px,5vw,38px)",color:T.green,fontWeight:300,lineHeight:1}}>{fmt(res.totalFirstYear)}</div>
            {res.totalBonus>0&&<div style={{fontSize:10,color:"#3a7040",marginTop:4}}>{"(incl. bonus "}{fmt(res.totalBonus)}{")"}</div>}
            <div style={{fontSize:11,color:"#3a7040",marginTop:8}}>{"Annual (Yr 2+): "}<strong>{fmt(res.totalAnnual)}</strong></div>
          </div>
          <div style={{background:"linear-gradient(135deg,#0a100a,#060a06)",border:"1px solid "+T.goldDim,borderRadius:10,padding:"16px 14px"}}>
            <div style={{fontSize:9,letterSpacing:"0.2em",textTransform:"uppercase",color:T.goldDim,marginBottom:6}}>{"Property Cost Basis"}</div>
            <div style={{fontSize:"clamp(24px,4.5vw,34px)",color:T.gold,fontWeight:300,lineHeight:1}}>{fmt(res.totalBasis)}</div>
            {res.netLoanCosts>0&&<div style={{fontSize:10,color:T.goldDim,marginTop:4}}>{"Loan cost basis: "}{fmt(res.netLoanCosts)}</div>}
            <div style={{fontSize:11,color:T.goldDim,marginTop:4}}>{"Deductible this year: "}<strong style={{color:T.green}}>{fmt(res.currentYearDeductible)}</strong></div>
          </div>
        </div>

        {/* Full summary */}
        <Card>
          <CardTitle>{"Complete Analysis"}</CardTitle>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,marginTop:8}}>
            <tbody>
              <tr><td colSpan={2} style={{padding:"4px 0 2px",fontSize:9,color:"#4a6fa8",fontWeight:700,textTransform:"uppercase"}}>{"PROPERTY COST BASIS"}</td></tr>
              <SRow label={"Purchase price"} value={fmt(parse(res.inp.purchasePrice))}/>
              {res.basisCC>0&&<SRow label={"+ HUD-1 closing costs (B)"} value={fmt(res.basisCC)} color="#6a8fc0" indent/>}
              {res.pocBasis>0&&<SRow label={"+ POC basis items"} value={fmt(res.pocBasis)} color="#6a8fc0" indent/>}
              {res.taxAdjAmt>0&&<SRow label={"− Tax adjustment (seller)"} value={"("+fmt(res.taxAdjAmt)+")"} color={T.amber} indent/>}
              {res.sellerCrAmt>0&&<SRow label={"− Seller credit"} value={"("+fmt(res.sellerCrAmt)+")"} color={T.amber} indent/>}
              {res.proratedHOAAmt>0&&<SRow label={"− Prorated HOA / other"} value={"("+fmt(res.proratedHOAAmt)+")"} color={T.amber} indent/>}
              <SRow label={"= Property cost basis"} value={fmt(res.totalBasis)} bold color={T.gold}/>
              <SRow label={"  − Land (not depreciable)"} value={"("+fmt(res.landBasis)+")"} color={T.red} indent/>
              <SRow label={"  = Building basis (depreciable)"} value={fmt(res.buildingBasis)} bold color={T.gold} indent/>
              {res.hasloan&&res.netLoanCosts>0&&(<>
                <Div/>
                <tr><td colSpan={2} style={{padding:"4px 0 2px",fontSize:9,color:"#a080c0",fontWeight:700,textTransform:"uppercase"}}>{"LOAN COST BASIS"}</td></tr>
                <SRow label={"HUD-1 loan costs (C)"} value={fmt(res.grossLoanCosts)}/>
                {res.pocLoan>0&&<SRow label={"+ POC loan costs"} value={fmt(res.pocLoan)} color="#6a8fc0" indent/>}
                {res.lenderCreditAmt>0&&<SRow label={"− Lender credit"} value={"("+fmt(res.lenderCreditAmt)+")"} color={T.green} indent/>}
                <SRow label={"= Net loan cost basis"} value={fmt(res.netLoanCosts)} bold/>
              </>)}
              {res.currentYearDeductible>0&&(<>
                <Div/>
                <tr><td colSpan={2} style={{padding:"4px 0 2px",fontSize:9,color:T.green,fontWeight:700,textTransform:"uppercase"}}>{"CURRENTLY DEDUCTIBLE"}</td></tr>
                {parse(res.inp.propertyTaxClosing)>0&&<SRow label={"Property taxes"} value={fmt(parse(res.inp.propertyTaxClosing))} color={T.green}/>}
                {parse(res.inp.prepaidInterest)>0&&<SRow label={"Prepaid interest"} value={fmt(parse(res.inp.prepaidInterest))} color={T.green}/>}
                {parse(res.inp.insuranceMIP)>0&&<SRow label={"Insurance + MIP/PMI"} value={fmt(parse(res.inp.insuranceMIP))} color={T.green}/>}
                <SRow label={"= Total deductible"} value={fmt(res.currentYearDeductible)} bold color={T.green}/>
              </>)}
              <Div/>
              <tr><td colSpan={2} style={{padding:"4px 0 2px",fontSize:9,color:"#4a7020",fontWeight:700,textTransform:"uppercase"}}>{"CASH-TO-CLOSE RECONCILIATION"}</td></tr>
              <SRow label={"Gross amount due"} value={fmt(res.totalCharges)}/>
              <SRow label={"− All reductions"} value={"("+fmt(res.calcCashToClose>0?res.totalCharges-res.calcCashToClose:0)+")"} color={T.green} indent/>
              <SRow label={"= Cash due from borrower (Line 303)"} value={fmt(res.calcCashToClose)} bold color={T.gold}/>
            </tbody>
          </table>
        </Card>

        {/* Depreciation schedule */}
        <Card>
          <CardTitle>{"Depreciation Schedule"}</CardTitle>
          <CardSub>{"27.5/39yr: Straight-line mid-month · 15yr: 150% DB · 5/7yr: 200% DB"+(res.totalBonus>0?" + bonus "+parse(res.inp.bonusPct)+"% for 5/7/15yr":"")}</CardSub>
          <div style={{overflowX:"auto",marginTop:8}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:440}}>
              <thead>
                <tr style={{borderBottom:"1px solid "+T.border}}>
                  {["Asset Class","Life","Basis","Bonus","Year 1","Annual"].map((h,i)=>(
                    <th key={i} style={{textAlign:"left",padding:"5px 4px 5px 0",color:T.textDim,fontWeight:400,fontSize:8,letterSpacing:"0.06em",textTransform:"uppercase"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {res.classResults.map((c,i)=>(
                  <tr key={i} style={{borderBottom:"1px solid "+T.border}}>
                    <td style={{padding:"8px 4px 8px 0",color:c.color,fontWeight:500}}>{c.label}</td>
                    <td style={{padding:"8px 4px",color:T.textMid}}>{c.life}yr</td>
                    <td style={{padding:"8px 4px",color:T.text}}>{fmt(c.basis)}</td>
                    <td style={{padding:"8px 4px",color:c.bonus>0?T.gold:T.textDim}}>{c.bonus>0?fmt(c.bonus):"—"}</td>
                    <td style={{padding:"8px 4px",color:T.green,fontWeight:500}}>{fmt(c.firstYear)}</td>
                    <td style={{padding:"8px 4px",color:T.green}}>{fmt(c.annual)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{borderTop:"2px solid "+T.border}}>
                  <td colSpan={4} style={{padding:"9px 0",color:T.gold,fontWeight:700}}>{"Total"}</td>
                  <td style={{padding:"9px 0",color:T.gold,fontWeight:700}}>{fmt(res.totalFirstYear)}</td>
                  <td style={{padding:"9px 0",color:T.gold,fontWeight:700}}>{fmt(res.totalAnnual)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <IBox tone="amber">{"⚠ When you sell: all depreciation recaptured at 25% flat rate (Section 1250). Consider a 1031 exchange to defer."}</IBox>
        </Card>

        <p style={{fontSize:10,color:T.textDim,textAlign:"center",lineHeight:1.6,marginTop:10}}>{"Estimates only — not tax advice. Consult a CPA before claiming."}</p>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:12}}>
          <Btn ghost small onClick={()=>{setStep(2);setRes(null);}}>{"← Adjust"}</Btn>
          <Btn ghost small onClick={resetAll}>{"Start Over"}</Btn>
        </div>
      </div>)}
    </div>
  );
}

function CapGainsCalc({lang:L="en"}){
  const [inp,setInp]=useState({
    saleDate:"",purchaseDate:"",
    salePrice:"",basis:"",improvements:"",depreciation:"",expenses:"",
    fs:"single",agi:"",primary:false,years:""
  });
  const [res,setRes]=useState(null);
  const s=(k,v)=>setInp(p=>({...p,[k]:v}));
  const FS=[
    {value:"single",label:L==="vi"?"Độc thân":L==="es"?"Soltero/a":"Single"},
    {value:"mfj",label:L==="vi"?"Vợ chồng chung":L==="es"?"Casado conjunto":"Married Filing Jointly"},
    {value:"mfs",label:L==="vi"?"Vợ chồng riêng":L==="es"?"Casado separado":"Married Filing Separately"},
    {value:"hoh",label:L==="vi"?"Chủ hộ":L==="es"?"Jefe hogar":"Head of Household"},
  ];

  // Determine holding period from dates
  function holdingPeriod(){
    if(!inp.purchaseDate||!inp.saleDate) return null;
    const purchase=new Date(inp.purchaseDate);
    const sale=new Date(inp.saleDate);
    if(isNaN(purchase)||isNaN(sale)) return null;
    const days=Math.round((sale-purchase)/(1000*60*60*24));
    return {days, longTerm: days>365,
      label: days>365
        ? `Long-term (${Math.floor(days/365)}yr ${days%365}d) — preferential rates apply`
        : `Short-term (${days} days) — taxed as ordinary income`};
  }

  // Correct LTCG tax: stack gains on top of ordinary taxable income
  function calcLTCG(gain, fs, ordinaryAGI){
    const stdDed = STD_DED[fs]||14600;
    const ordinaryTaxable = Math.max(0, ordinaryAGI - stdDed);
    const b = CG_BRACKETS[fs]||CG_BRACKETS.single;
    let prev=0, tax=0, remaining=gain;
    for(const [cap,rate] of b){
      // How much of this bracket is already used by ordinary income?
      const usedByOrdinary = Math.min(ordinaryTaxable, cap) - prev;
      const roomInBracket = Math.max(0, cap - prev - usedByOrdinary);
      const gainInBracket = Math.min(remaining, roomInBracket);
      tax += gainInBracket * rate;
      remaining -= gainInBracket;
      prev = cap;
      if(remaining <= 0) break;
    }
    return Math.round(tax);
  }

  function doCalc(){
    const sale=parse(inp.salePrice), costBasis=parse(inp.basis);
    const impr=parse(inp.improvements), dep=parse(inp.depreciation);
    const exp=parse(inp.expenses), agi=parse(inp.agi);

    const hp = holdingPeriod();
    const isLongTerm = hp ? hp.longTerm : true; // assume long-term if no dates

    // Adjusted basis = original cost + improvements - depreciation claimed
    const adjBasis = costBasis + impr - dep;

    // Amount realized = sale price - selling expenses
    const amtRealized = sale - exp;

    // Realized gain = amount realized - adjusted basis
    const realizedGain = amtRealized - adjBasis;

    if(realizedGain <= 0){
      setRes({realizedGain,adjBasis,amtRealized,exclusion:0,taxableGain:0,
        recapture:0,recaptureTax:0,cgGain:0,cgT:0,niit:0,total:0,hp,isLongTerm,
        shortTermTax:0,isLoss:true});
      return;
    }

    // Primary home exclusion (Section 121)
    let exclusion=0;
    if(inp.primary && parse(inp.years)>=2){
      exclusion = Math.min(realizedGain, inp.fs==="mfj" ? 500000 : 250000);
    }

    // Gain after exclusion
    const gainAfterExclusion = Math.max(0, realizedGain - exclusion);

    // Depreciation recapture (Section 1250) — always ordinary @25%, regardless of holding period
    // Capped at the lesser of: depreciation claimed OR total gain
    const recapture = Math.min(dep, gainAfterExclusion);
    const recaptureTax = Math.round(recapture * 0.25);

    // Remaining gain above recapture = LTCG (or STCG if short-term)
    const capitalGain = Math.max(0, gainAfterExclusion - recapture);

    let cgT = 0;
    let shortTermTax = 0;

    if(!isLongTerm){
      // Short-term: taxed as ordinary income — add to AGI and compute marginal rate
      // Approximate: full gain taxed at ordinary rates via estTax stacking
      const taxWithGain = estTax(agi + gainAfterExclusion, inp.fs);
      const taxWithout = estTax(agi, inp.fs);
      shortTermTax = Math.max(0, taxWithGain - taxWithout);
      cgT = 0; // no preferential rate for short-term
    } else {
      // Long-term: stacked LTCG calculation
      cgT = calcLTCG(capitalGain, inp.fs, agi);
    }

    // NIIT: 3.8% on lesser of net investment income OR MAGI over threshold
    // Net investment income = capital gain + recapture gain
    const niitThresh = inp.fs==="mfj" ? 250000 : inp.fs==="mfs" ? 125000 : 200000;
    const totalAGIwithGain = agi + gainAfterExclusion;
    const nii = gainAfterExclusion; // gain is net investment income
    const niit = isLongTerm && totalAGIwithGain > niitThresh
      ? Math.round(Math.min(nii, totalAGIwithGain - niitThresh) * 0.038)
      : 0;

    const total = isLongTerm
      ? recaptureTax + cgT + niit
      : shortTermTax + recaptureTax; // recapture still applies even short-term

    setRes({
      adjBasis, amtRealized, realizedGain, exclusion,
      gainAfterExclusion, recapture, recaptureTax,
      capitalGain, cgT, shortTermTax, niit, total,
      hp, isLongTerm, isLoss: false,
      effectiveRate: total > 0 ? total/realizedGain : 0,
    });
  }

  const hp = holdingPeriod();

  return(
    <div>
      <div style={{marginBottom:16}}>
        <h3 style={{margin:"0 0 4px",fontSize:15,fontWeight:400,color:T.gold}}>
          {L==="vi"?"Thuế Lợi Vốn Bán Nhà":L==="es"?"Impuesto Ganancias de Capital":"Capital Gains Tax on Property Sale"}
        </h3>
        <p style={{margin:0,fontSize:12,color:T.textDim}}>
          {"Federal capital gains tax estimate — uses taxable income stacking for accurate bracket calculation"}
        </p>
      </div>

      {/* Dates — determine holding period */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:4}}>
        <Fld label={"Purchase Date"} hint={"Determines short vs long-term"}>
          <input type="date" value={inp.purchaseDate} onChange={e=>s("purchaseDate",e.target.value)}
            style={{width:"100%",background:"#0a0c0f",border:`1px solid ${T.border}`,borderRadius:6,
              padding:"10px 12px",fontSize:14,color:T.text,fontFamily:"inherit",outline:"none",
              boxSizing:"border-box",colorScheme:"dark"}}/>
        </Fld>
        <Fld label={"Sale Date"}>
          <input type="date" value={inp.saleDate} onChange={e=>s("saleDate",e.target.value)}
            style={{width:"100%",background:"#0a0c0f",border:`1px solid ${T.border}`,borderRadius:6,
              padding:"10px 12px",fontSize:14,color:T.text,fontFamily:"inherit",outline:"none",
              boxSizing:"border-box",colorScheme:"dark"}}/>
        </Fld>
      </div>
      {hp&&(
        <div style={{marginBottom:12,padding:"8px 12px",borderRadius:6,
          background:hp.longTerm?"rgba(74,144,96,0.08)":"rgba(192,112,80,0.08)",
          border:`1px solid ${hp.longTerm?T.green:T.red}40`,fontSize:12,
          color:hp.longTerm?T.green:T.red,fontWeight:500}}>
          {hp.longTerm?"✓ ":"⚠ "}{hp.label}
        </div>
      )}

      {/* Property values */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Fld label={"Sale Price"}><Inp value={inp.salePrice} onChange={v=>s("salePrice",v)} placeholder="0" prefix="$"/></Fld>
        <Fld label={"Selling Expenses"} hint={"Commissions, closing costs, fees"} optional optLbl="optional"><Inp value={inp.expenses} onChange={v=>s("expenses",v)} placeholder="0" prefix="$"/></Fld>
        <Fld label={"Original Cost Basis"} hint={"Purchase price + capitalized closing costs"}><Inp value={inp.basis} onChange={v=>s("basis",v)} placeholder="0" prefix="$"/></Fld>
        <Fld label={"Capital Improvements"} optional optLbl="optional"><Inp value={inp.improvements} onChange={v=>s("improvements",v)} placeholder="0" prefix="$"/></Fld>
        <Fld label={"Accumulated Depreciation Claimed"} hint={"Total depreciation taken — recaptured @25% (Section 1250)"} optional optLbl="optional">
          <Inp value={inp.depreciation} onChange={v=>s("depreciation",v)} placeholder="0" prefix="$"/>
        </Fld>
        <Fld label={"Filing Status"} hint={"Affects capital gains bracket thresholds — 0%/15%/20% cutoffs vary by status"}><Sel value={inp.fs} onChange={v=>s("fs",v)} options={FS}/></Fld>
        <div style={{gridColumn:"1/-1"}}>
          <Fld label={"Estimated Taxable Income Before This Sale"} hint={"Your approximate taxable income after deductions, before this property sale (W-2, business, rental, etc.). Used to determine which capital gains bracket applies via income stacking."}>
            <Inp value={inp.agi} onChange={v=>s("agi",v)} placeholder="0" prefix="$"/>
          </Fld>
        </div>
      </div>

      {/* Primary home */}
      <div style={{margin:"8px 0"}}>
        <div onClick={()=>s("primary",!inp.primary)} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"10px 14px",borderRadius:7,
          background:inp.primary?"rgba(200,169,110,0.08)":T.bgCard,border:`1px solid ${inp.primary?T.goldDim:T.border}`,transition:"all 0.15s"}}>
          <div style={{width:18,height:18,borderRadius:4,border:`1px solid ${inp.primary?T.gold:T.border}`,background:inp.primary?T.gold:"transparent",
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#050608",flexShrink:0}}>
            {inp.primary&&"✓"}
          </div>
          <span style={{fontSize:13,color:inp.primary?T.gold:T.textMid}}>{"This is / was my primary residence"}</span>
        </div>
        {inp.primary&&(
          <div style={{marginTop:8}}>
            <Fld label={"Years owned AND lived there"} hint={"Need 2+ of last 5 years for Section 121 exclusion ($250k single / $500k MFJ)"}>
              <Inp value={inp.years} onChange={v=>s("years",v)} placeholder="0"/>
            </Fld>
          </div>
        )}
      </div>

      <details style={{margin:"12px 0",background:"rgba(200,169,110,0.04)",border:"1px solid "+T.goldDim+"60",borderRadius:8}}>
        <summary style={{padding:"10px 14px",cursor:"pointer",fontSize:12,color:T.goldDim,fontWeight:600,listStyle:"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          {"ℹ️  How This Calculation Works"}
          <span style={{fontSize:10,color:T.textDim}}>{"click to expand"}</span>
        </summary>
        <div style={{padding:"0 14px 14px",fontSize:11,color:T.textMid,lineHeight:1.7}}>
          <p style={{margin:"8px 0 4px",color:T.text,fontWeight:600}}>{"Step 1 — Realized Gain"}</p>
          <p style={{margin:"0 0 8px",fontFamily:"monospace",fontSize:10,color:T.textDim,background:"#0a0c0f",padding:"6px 10px",borderRadius:4}}>
            {"Realized Gain = Sale Price − Selling Expenses − Adjusted Basis"}<br/>
            {"Adjusted Basis = Purchase Price + Improvements − Depreciation Claimed"}
          </p>
          <p style={{margin:"8px 0 4px",color:T.text,fontWeight:600}}>{"Step 2 — Three Types of Tax"}</p>
          <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:"2px 10px",fontSize:11}}>
            <span style={{color:T.red,fontWeight:600}}>{"§1250 Recapture:"}</span>
            <span>{"All depreciation claimed → taxed at max 25% (Unrecaptured Section 1250 Gain)"}</span>
            <span style={{color:T.amber,fontWeight:600}}>{"LTCG:"}</span>
            <span>{"Remaining long-term gain → 0%, 15%, or 20% based on your taxable income"}</span>
            <span style={{color:T.accent,fontWeight:600}}>{"NIIT:"}</span>
            <span>{"3.8% extra if total income exceeds $200k (single) or $250k (MFJ)"}</span>
          </div>
          <p style={{margin:"8px 0 4px",color:T.text,fontWeight:600}}>{"Step 3 — Income Stacking"}</p>
          <p style={{margin:"0",color:T.textDim}}>
            {"Capital gains are stacked on top of your ordinary income. Your other income fills the lower CG brackets first — your gains are taxed starting from where your ordinary income leaves off. This calculator uses taxable income (not AGI) for bracket placement."}
          </p>
        </div>
      </details>
      <div style={{display:"flex",gap:8,marginTop:8}}>
        <GoldBtn onClick={doCalc}>{"Calculate Capital Gains Tax"}</GoldBtn>
        <OutlineBtn onClick={()=>{setInp({saleDate:"",purchaseDate:"",salePrice:"",basis:"",improvements:"",depreciation:"",expenses:"",fs:"single",agi:"",primary:false,years:""});setRes(null);}}>{"Reset"}</OutlineBtn>
      </div>

      {res&&(<div style={{marginTop:20}}>
        {res.isLoss&&(
          <div style={{padding:"16px",background:"rgba(74,144,96,0.08)",border:"1px solid "+T.green,borderRadius:10,marginBottom:12}}>
            <div style={{fontSize:14,color:T.green,fontWeight:600,marginBottom:4}}>{"No Capital Gain — Property Sold at a Loss or Break-Even"}</div>
            <div style={{fontSize:12,color:T.textMid}}>{"Realized gain: "}<strong style={{color:T.green}}>{fmt(res.realizedGain)}</strong>{" — rental property losses may offset other income (subject to PAL rules)"}</div>
          </div>
        )}
        {!res.isLoss&&(<>
          {/* Holding period banner */}
          <div style={{padding:"10px 14px",borderRadius:7,marginBottom:12,
            background:res.isLongTerm?"rgba(74,144,96,0.1)":"rgba(192,112,80,0.1)",
            border:`1px solid ${res.isLongTerm?T.green:T.red}50`}}>
            <span style={{fontSize:12,color:res.isLongTerm?T.green:T.red,fontWeight:600}}>
              {res.isLongTerm?"✓ Long-term gain — preferential rates":"⚠ Short-term gain — taxed as ordinary income"}
            </span>
            {!hp&&<span style={{fontSize:10,color:T.textDim,marginLeft:8}}>{"(add purchase/sale dates for precise calculation)"}</span>}
          </div>

          {/* Gain calculation breakdown */}
          <Card>
            <CardTitle>{"Gain Calculation"}</CardTitle>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,marginTop:8}}>
              <tbody>
                <tr style={{borderBottom:"1px solid "+T.border}}>
                  <td style={{padding:"6px 0",color:T.textMid}}>{"Sale price"}</td>
                  <td style={{padding:"6px 0",textAlign:"right",color:T.text}}>{fmt(parse(inp.salePrice))}</td>
                </tr>
                <tr style={{borderBottom:"1px solid "+T.border}}>
                  <td style={{padding:"6px 0",color:T.textMid}}>{"− Selling expenses"}</td>
                  <td style={{padding:"6px 0",textAlign:"right",color:T.text}}>{"("+fmt(parse(inp.expenses))+")"}</td>
                </tr>
                <tr style={{borderBottom:"1px solid "+T.border}}>
                  <td style={{padding:"6px 0",color:T.textMid,fontWeight:500}}>{"= Amount Realized"}</td>
                  <td style={{padding:"6px 0",textAlign:"right",color:T.text,fontWeight:500}}>{fmt(res.amtRealized)}</td>
                </tr>
                <tr style={{borderBottom:"1px solid "+T.border}}>
                  <td style={{padding:"6px 0",color:T.textDim,paddingLeft:12,fontSize:11}}>{"Original basis: "+fmt(parse(inp.basis))}</td>
                  <td style={{padding:"6px 0"}}/>
                </tr>
                {parse(inp.improvements)>0&&<tr style={{borderBottom:"1px solid "+T.border}}>
                  <td style={{padding:"4px 0",color:T.textDim,paddingLeft:12,fontSize:11}}>{"+ Improvements: "+fmt(parse(inp.improvements))}</td>
                  <td style={{padding:"4px 0"}}/>
                </tr>}
                {parse(inp.depreciation)>0&&<tr style={{borderBottom:"1px solid "+T.border}}>
                  <td style={{padding:"4px 0",color:T.textDim,paddingLeft:12,fontSize:11}}>{"− Depreciation claimed: ("+fmt(parse(inp.depreciation))+")"}</td>
                  <td style={{padding:"4px 0"}}/>
                </tr>}
                <tr style={{borderBottom:"1px solid "+T.border}}>
                  <td style={{padding:"6px 0",color:T.textMid}}>{"− Adjusted Basis"}</td>
                  <td style={{padding:"6px 0",textAlign:"right",color:T.text}}>{"("+fmt(res.adjBasis)+")"}</td>
                </tr>
                <tr style={{background:"rgba(200,169,110,0.06)"}}>
                  <td style={{padding:"8px 0",color:T.gold,fontWeight:700}}>{"= Total Realized Gain"}</td>
                  <td style={{padding:"8px 0",textAlign:"right",color:T.gold,fontWeight:700}}>{fmt(res.realizedGain)}</td>
                </tr>
                {res.exclusion>0&&<>
                  <tr><td style={{padding:"6px 0",color:T.green}}>{"− Section 121 Exclusion (primary home)"}</td>
                    <td style={{padding:"6px 0",textAlign:"right",color:T.green}}>{"("+fmt(res.exclusion)+")"}</td></tr>
                </>}
                <tr style={{background:"rgba(200,169,110,0.06)"}}>
                  <td style={{padding:"8px 0",color:T.gold,fontWeight:600}}>{"= Gain Subject to Tax"}</td>
                  <td style={{padding:"8px 0",textAlign:"right",color:T.gold,fontWeight:600}}>{fmt(res.gainAfterExclusion)}</td>
                </tr>
              </tbody>
            </table>
          </Card>

          {/* Tax breakdown */}
          <Card>
            <CardTitle>{"Tax Breakdown"}</CardTitle>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,marginTop:8}}>
              <tbody>
                {res.recapture>0&&<>
                  <tr style={{borderBottom:"1px solid "+T.border}}>
                    <td style={{padding:"6px 0",color:T.textMid}}>
                      {"Depreciation Recapture — Unrecaptured §1250 Gain"}
                      <div style={{fontSize:10,color:T.textDim}}>{fmt(res.recapture)+" → Unrecaptured §1250 Gain, taxed at max 25% rate"}</div>
                    </td>
                    <td style={{padding:"6px 0",textAlign:"right",color:T.red,fontWeight:600}}>{fmt(res.recaptureTax)}</td>
                  </tr>
                </>}
                {res.isLongTerm&&res.capitalGain>0&&<>
                  <tr style={{borderBottom:"1px solid "+T.border}}>
                    <td style={{padding:"6px 0",color:T.textMid}}>
                      {"Long-term capital gains tax"}
                      <div style={{fontSize:10,color:T.textDim}}>
                        {fmt(res.capitalGain)+" stacked on top of "+fmt(parse(inp.agi))+" other income — bracket stacking method"}
                      </div>
                    </td>
                    <td style={{padding:"6px 0",textAlign:"right",color:T.red,fontWeight:600}}>{fmt(res.cgT)}</td>
                  </tr>
                </>}
                {!res.isLongTerm&&res.gainAfterExclusion>0&&<>
                  <tr style={{borderBottom:"1px solid "+T.border}}>
                    <td style={{padding:"6px 0",color:T.textMid}}>
                      {"Short-term capital gains tax"}
                      <div style={{fontSize:10,color:T.textDim}}>{"Short-term gain taxed at your ordinary marginal rate (10%–37%)"}</div>
                    </td>
                    <td style={{padding:"6px 0",textAlign:"right",color:T.red,fontWeight:600}}>{fmt(res.shortTermTax)}</td>
                  </tr>
                </>}
                {res.niit>0&&<tr style={{borderBottom:"1px solid "+T.border}}>
                  <td style={{padding:"6px 0",color:T.textMid}}>
                    {"Net Investment Income Tax (3.8%)"}
                    <div style={{fontSize:10,color:T.textDim}}>{"Applies when total AGI exceeds $"+(inp.fs==="mfj"?"250,000":inp.fs==="mfs"?"125,000":"200,000")}</div>
                  </td>
                  <td style={{padding:"6px 0",textAlign:"right",color:T.red}}>{fmt(res.niit)}</td>
                </tr>}
                <tr style={{background:"rgba(192,112,80,0.08)"}}>
                  <td style={{padding:"10px 0",color:T.gold,fontWeight:700,fontSize:14}}>{"TOTAL ESTIMATED TAX"}</td>
                  <td style={{padding:"10px 0",textAlign:"right",color:T.gold,fontWeight:700,fontSize:16}}>{fmt(res.total)}</td>
                </tr>
                {res.effectiveRate>0&&<tr>
                  <td colSpan={2} style={{padding:"6px 0",fontSize:11,color:T.textDim,textAlign:"right"}}>
                    {"Effective rate on gain: "+(res.effectiveRate*100).toFixed(1)+"%"}
                  </td>
                </tr>}
              </tbody>
            </table>
          </Card>

          {/* Key notes */}
          <IBox tone="amber">
            {"⚠ Depreciation recapture at 25% applies to ALL accumulated depreciation — even if you qualify for the primary home exclusion. Plan accordingly."}
          </IBox>
          {res.isLongTerm&&<IBox tone="green">
            {"✓ Long-term rates used (0% / 15% / 20%). Income stacking: your other income fills the lower brackets first, then gains are taxed at the rate that applies to the top of your total income."}
          </IBox>}
          {!res.isLongTerm&&<IBox tone="red">
            {"⚠ Short-term: held ≤ 1 year — gain taxed at ordinary income rates (10%–37%). Consider holding until long-term if possible."}
          </IBox>}
          <IBox>{"💡 A 1031 exchange can defer ALL of this tax. See our 1031 Exchange calculator."}</IBox>
        </>)}
        <p style={{fontSize:10,color:T.textDim,textAlign:"center",lineHeight:1.6,marginTop:12}}>
          {"Federal estimate only. State taxes, passive loss rules, NIIT, and individual tax situations may affect your final tax liability. Consult a CPA before filing."}
        </p>
      </div>)}
    </div>
  );
}

function STRCalc({lang:L="en"}){
  const [inp,setInp]=useState({rentalDays:"",personalDays:"",income:"",expenses:"",fairRentDays:"",agi:"",fs:"single",mpTest:"none"});
  const [res,setRes]=useState(null);
  const s=(k,v)=>setInp(p=>({...p,[k]:v}));
  const TX={
    title:L==="vi"?"Thuế Cho Thuê Ngắn Hạn (Airbnb)":L==="es"?"Impuesto Alquiler a Corto Plazo":"Short-Term Rental Tax Calculator",
    sub:L==="vi"?"Xác định nghĩa vụ thuế Airbnb/VRBO của bạn bao gồm quy tắc 14 ngày":L==="es"?"Determine sus obligaciones fiscales de Airbnb/VRBO incluyendo la regla de los 14 días":"Determine your Airbnb/VRBO tax obligations including the 14-day rule",
    rentalL:L==="vi"?"Ngày cho thuê":L==="es"?"Días de alquiler":"Rental days",
    personalL:L==="vi"?"Ngày sử dụng cá nhân":L==="es"?"Días de uso personal":"Personal use days",
    incomeL:L==="vi"?"Tổng thu nhập cho thuê":L==="es"?"Ingresos totales de alquiler":"Total rental income",
    expensesL:L==="vi"?"Tổng chi phí":L==="es"?"Gastos totales":"Total expenses",
    expH:L==="vi"?"Thế chấp, bảo hiểm, tiện ích, sửa chữa, v.v.":L==="es"?"Hipoteca, seguro, servicios, reparaciones, etc.":"Mortgage, insurance, utilities, repairs, etc.",
    fsL:L==="vi"?"Tình trạng khai thuế":L==="es"?"Estado civil":"Filing status",
    calc:L==="vi"?"Phân Tích Tình Trạng Thuế":L==="es"?"Analizar Estado Fiscal":"Analyze Tax Status",
    reset:L==="vi"?"Đặt Lại":L==="es"?"Restablecer":"Reset",
    FS:[
      {value:"single",label:L==="vi"?"Độc thân":L==="es"?"Soltero/a":"Single"},
      {value:"mfj",label:L==="vi"?"VCK chung":L==="es"?"Casado conjunto":"Married Joint"},
    ],
  };
  function doCalc(){
    const rd=parse(inp.rentalDays), pd=parse(inp.personalDays);
    const inc=parse(inp.income), exp=parse(inp.expenses);
    const agi=parse(inp.agi);
    const total=rd+pd;

    // Average stay determines STR vs long-term rental classification
    // STR = average stay ≤7 days (per IRC §469(c)(7))
    // This is a PROPERTY characteristic, not a participation test
    const avgStay = rd>0 ? rd/Math.max(1,parse(inp.guestStays)||rd) : 0;
    // We don't collect guest stays — use rental days as proxy: if user confirms STR
    // The STR label on this calc implies avg stay ≤7 days
    const isSTR = true; // This calc is for STR by design

    // Expense allocation: rental days / total days
    const rentalPct = total>0 ? rd/total : 1;
    const deductibleExp = Math.round(exp*rentalPct*100)/100;
    const netIncome = inc - deductibleExp; // can be negative (loss)
    const taxableIncome = Math.max(0, netIncome); // for income tax estimate
    const netLoss = Math.min(0, netIncome);

    // 14-day rule: rented ≤14 days → income NOT reportable (§280A(g))
    const rule14 = rd<=14 && rd>0;

    // Vacation home test: personal use > greater of 14 days or 10% of rental days
    const personalThreshold = Math.max(14, Math.round(rd*0.10));
    const isVacationHome = pd>personalThreshold;

    // Material participation tests (IRC §469(h)) — must meet ONE:
    // Test 1: 500+ hours in the activity
    // Test 2: Substantially all participation (no one else significantly participates)
    // Test 3: 100+ hours AND more than any other individual
    // Test 4: Significant participation (100+ hrs) and all sig. participation >500 hrs total
    // Test 5: Material participant in 5 of last 10 years
    // Test 6: Personal service activity, material in any 3 prior years
    // Test 7: Facts and circumstances (rare)
    const mpTest = inp.mpTest || "none";
    const isMaterialParticipation = mpTest !== "none";

    // STR classification matrix (IRS rules):
    // Avg stay ≤7 days + material participation → NON-PASSIVE (no PAL, no $25k)
    // Avg stay ≤7 days + NO material participation → "OTHER PASSIVE" (no $25k allowance, losses carry forward only)
    // Avg stay 8-30 days + material participation → NON-PASSIVE
    // Avg stay >30 days (regular rental) + active participation → passive with $25k allowance
    // Vacation home → expenses capped at income
    const isNonPassive = isMaterialParticipation && !isVacationHome;
    // STR passive (avg stay ≤7 days, no MP) = "other passive" — NO $25k allowance
    // The $25k allowance only applies to regular rental activity (avg stay >7 days)
    const has25kAllowance = false; // STR never gets $25k — that's for long-term rental

    // Estimated income tax (rough, using ordinary rate stacking)
    const estimatedIncomeTax = taxableIncome>0
      ? Math.round(estTax(agi+taxableIncome, inp.fs) - estTax(agi, inp.fs))
      : 0;

    setRes({rd,pd,inc,exp,agi,rentalPct,deductibleExp,netIncome,taxableIncome,netLoss,
      rule14,isVacationHome,isNonPassive,isMaterialParticipation,mpTest,
      estimatedIncomeTax,total,personalThreshold,has25kAllowance});
  }
  return(
    <div>
      <div style={{marginBottom:20}}>
        <h3 style={{margin:"0 0 4px",fontSize:15,fontWeight:400,color:T.gold}}>{TX.title}</h3>
        <p style={{margin:0,fontSize:12,color:T.textDim}}>{TX.sub}</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Fld label={TX.rentalL}><Inp value={inp.rentalDays} onChange={v=>s("rentalDays",v)} placeholder="0"/></Fld>
        <Fld label={TX.personalL}><Inp value={inp.personalDays} onChange={v=>s("personalDays",v)} placeholder="0"/></Fld>
        <Fld label={TX.incomeL}><Inp value={inp.income} onChange={v=>s("income",v)} placeholder="0" prefix="$"/></Fld>
        <Fld label={TX.expensesL} hint={TX.expH}><Inp value={inp.expenses} onChange={v=>s("expenses",v)} placeholder="0" prefix="$"/></Fld>
        <Fld label={TX.fsL}><Sel value={inp.fs} onChange={v=>s("fs",v)} options={TX.FS}/></Fld>
        <Fld label={"Your AGI (other income, excl. this rental)"} hint={"Used for accurate tax estimate"}><Inp value={inp.agi} onChange={v=>s("agi",v)} placeholder="0" prefix="$"/></Fld>
      </div>
      <div style={{padding:"10px 14px",background:T.bgCard2,border:"1px solid "+T.border,borderRadius:8,marginBottom:8}}>
        <div style={{fontSize:11,color:T.textMid,fontWeight:600,marginBottom:8}}>{"Material Participation Test (IRC §469) — meet ONE to qualify:"}</div>
        <Sel value={inp.mpTest} onChange={v=>s("mpTest",v)} options={[
          {value:"none",label:"❌  None — I do NOT materially participate"},
          {value:"500hrs",label:"✅  Test 1 — 500+ hours in this rental this year"},
          {value:"allwork",label:"✅  Test 2 — Substantially all work done by me"},
          {value:"100hrs",label:"✅  Test 3 — 100+ hours AND more than anyone else"},
          {value:"prior5",label:"✅  Test 5 — Materially participated in 5 of last 10 years"},
        ]}/>
        <div style={{fontSize:9,color:T.textDim,marginTop:6,lineHeight:1.5,fontStyle:"italic"}}>
          {"⚠ For STR (avg stay ≤7 days): material participation → non-passive, losses offset any income. No material participation → 'other passive', losses carry forward only (no $25k allowance — that's for long-term rentals only)."}
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginTop:4}}>
        <GoldBtn onClick={doCalc}>{TX.calc}</GoldBtn>
        <OutlineBtn onClick={()=>{setInp({rentalDays:"",personalDays:"",income:"",expenses:"",fairRentDays:"",agi:"",fs:"single",mpTest:"none"});setRes(null);}}>{TX.reset}</OutlineBtn>
      </div>
      {res&&(<div style={{marginTop:20}}>
        {res.rule14&&<IBox tone="green">
          <strong>{L==="vi"?"✓ Quy Tắc 14 Ngày Được Áp Dụng":L==="es"?"✓ Regla de 14 Días Aplicada":"✓ 14-Day Rule Applies"}</strong><br/>
          {L==="vi"?"Bạn cho thuê 14 ngày hoặc ít hơn. Thu nhập cho thuê này KHÔNG phải khai báo thuế!":L==="es"?"Alquiló 14 días o menos. ¡Este ingreso NO se reporta en impuestos!":"You rented 14 days or fewer. This rental income is NOT reportable for federal income tax!"}
        </IBox>}
        {!res.rule14&&(<>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            {[
              {l:L==="vi"?"Tỷ Lệ Cho Thuê":L==="es"?"% de Alquiler":"Rental %",v:pct(res.rentalPct)},
              {l:L==="vi"?"Chi Phí Được Khấu Trừ":L==="es"?"Gastos Deducibles":"Deductible Expenses",v:fmt(res.deductibleExp),green:true},
              {l:"Net Taxable Income",v:res.netIncome>=0?fmt(res.taxableIncome):"("+fmt(Math.abs(res.netIncome))+" loss)",hi:true},
              {l:"Est. Income Tax",v:res.estimatedIncomeTax>0?fmt(res.estimatedIncomeTax)+" (~22%)"+"":"$0",hi:res.estimatedIncomeTax>0},
            ].map((it,i)=>(
              <div key={i} style={{background:T.bgCard2,border:`1px solid ${it.hi?T.goldDim:T.border}`,borderRadius:8,padding:"12px 14px"}}>
                <div style={{fontSize:10,color:T.textDim,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:3}}>{it.l}</div>
                <div style={{fontSize:17,color:it.hi?T.gold:it.green?T.green:T.text,fontWeight:300}}>{it.v}</div>
              </div>
            ))}
          </div>
          <IBox tone={res.isVacationHome?"amber":undefined}>
            {res.isVacationHome
              ?<>{"⚠ Vacation home rules apply — personal use exceeds the greater of 14 days or 10% of rental days. Deductible expenses capped at rental income. Losses cannot offset other income."}</>
              :res.isNonPassive
              ?<>{"✅ NON-PASSIVE — material participation confirmed. Net losses can offset ordinary income without PAL limits. Report on Schedule E. No self-employment tax."}</>
              :<>{"⚠ OTHER PASSIVE activity — STR with no material participation. Losses carry forward and can only offset future passive income. The $25,000 allowance does NOT apply to STR (it's for long-term rentals with avg stay >7 days only). Report on Schedule E."}</>
            }
          </IBox>
        </>)}
        <IBox>{"📋 Report on Schedule E (Form 1040), not Schedule C. Self-employment tax does not apply to typical vacation rentals where no substantial services are provided. Consult a CPA if you provide cleaning, meals, or daily services."}</IBox>
        <p style={{fontSize:10,color:T.textDim,marginTop:10,lineHeight:1.5}}>{"Estimates only — not tax advice."}</p>
      </div>)}
    </div>
  );
}

// ── 6. 1031 EXCHANGE ──────────────────────────────────────────────────────────
function Exchange1031Calc({lang:L="en"}){
  const [inp,setInp]=useState({
    salePrice:"",originalBasis:"",improvements:"",depreciation:"",
    mortgage:"",expenses:"",newPrice:"",newMortgage:"",fs:"single",agi:""
  });
  const [res,setRes]=useState(null);
  const s=(k,v)=>setInp(p=>({...p,[k]:v}));
  const FS=[
    {value:"single",label:"Single"},
    {value:"mfj",label:"Married Filing Jointly"},
    {value:"mfs",label:"Married Filing Separately"},
    {value:"hoh",label:"Head of Household"},
  ];

  function doCalc(){
    const sp=parse(inp.salePrice);
    const origBasis=parse(inp.originalBasis);
    const impr=parse(inp.improvements);
    const dep=parse(inp.depreciation);
    const mort=parse(inp.mortgage);
    const exp=parse(inp.expenses);
    const newP=parse(inp.newPrice);
    const newM=parse(inp.newMortgage);
    const agi=parse(inp.agi);

    // Adjusted basis = original + improvements - depreciation
    const adjBasis = Math.max(0, origBasis + impr - dep);

    // Amount realized and realized gain
    const amtRealized = sp - exp;
    const realizedGain = Math.max(0, amtRealized - adjBasis);

    // 1031 eligibility check
    const netEquity = sp - mort - exp;
    const mortgageBoot = newP > 0 ? Math.max(0, mort - newM) : 0;
    const equityBoot = newP > 0 ? Math.max(0, netEquity - (newP - newM)) : 0;
    const totalBoot = mortgageBoot + equityBoot;
    const fullyDeferred = newP >= sp && newM >= mort && equityBoot === 0;
    const partialBoot = !fullyDeferred && newP > 0;

    // Tax if sold normally — correct stacking method
    // Recapture: up to 25% on depreciation claimed (capped at gain)
    const recapture = Math.min(dep, realizedGain);
    const recaptureTax = Math.round(recapture * 0.25);

    // LTCG on remaining gain — stack on top of existing AGI
    const cgGain = Math.max(0, realizedGain - recapture);

    // Use correct bracket stacking (same as CapGainsCalc)
    function calcLTCG(gain, fs, ordAGI){
      const STD={single:14600,mfj:29200,mfs:14600,hoh:21900};
      const CGB={
        single:[[47025,0],[518900,.15],[Infinity,.20]],
        mfj:[[94050,0],[583750,.15],[Infinity,.20]],
        mfs:[[47025,0],[291850,.15],[Infinity,.20]],
        hoh:[[63000,0],[551350,.15],[Infinity,.20]],
      };
      const stdDed=STD[fs]||14600;
      const ordTaxable=Math.max(0,ordAGI-stdDed);
      const b=CGB[fs]||CGB.single;
      let prev=0,tax=0,remaining=gain;
      for(const [cap,rate] of b){
        const used=Math.min(ordTaxable,cap)-prev;
        const room=Math.max(0,cap-prev-used);
        const inBracket=Math.min(remaining,room);
        tax+=inBracket*rate; remaining-=inBracket; prev=cap;
        if(remaining<=0)break;
      }
      return Math.round(tax);
    }
    const cgT = calcLTCG(cgGain, inp.fs, agi);

    // NIIT: 3.8% on lesser of gain or (total AGI with gain - threshold)
    const niitThr={single:200000,mfj:250000,mfs:125000,hoh:200000}[inp.fs]||200000;
    const totalAGI = agi + realizedGain;
    const niit = totalAGI > niitThr
      ? Math.round(Math.min(realizedGain, totalAGI - niitThr) * 0.038)
      : 0;

    const taxIfSell = recaptureTax + cgT + niit;

    // Boot tax = proportion of tax on boot amount
    const bootTax = realizedGain > 0 && totalBoot > 0
      ? Math.round(Math.min(totalBoot / realizedGain, 1) * taxIfSell)
      : 0;

    // Eligibility
    let eligibility;
    if(!newP){eligibility="pending";}
    else if(fullyDeferred){eligibility="full";}
    else if(newP >= sp && totalBoot < realizedGain * 0.1){eligibility="partial";}
    else{eligibility="boot_risk";}

    setRes({
      adjBasis, amtRealized, realizedGain, recapture, recaptureTax,
      cgGain, cgT, niit, taxIfSell, boot:totalBoot, mortgageBoot, equityBoot,
      bootTax, netEquity, fullyDeferred, partialBoot, eligibility,
      minNewPrice:sp, minNewEquity:netEquity, dep
    });
  }

  return(
    <div>
      <div style={{marginBottom:14}}>
        <h3 style={{margin:"0 0 4px",fontSize:15,fontWeight:400,color:T.gold}}>{"1031 Exchange Calculator"}</h3>
        <p style={{margin:0,fontSize:12,color:T.textDim}}>{"Defer capital gains by reinvesting in like-kind property. Replacement must be identified within 45 days, closed within 180 days, through a Qualified Intermediary."}</p>
      </div>

      {/* Relinquished Property */}
      <div style={{padding:"10px 14px",background:T.bgCard2,border:"1px solid "+T.border,borderRadius:8,marginBottom:10}}>
        <p style={{fontSize:10,color:T.gold,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",margin:"0 0 10px"}}>{"Relinquished Property (Property You're Selling)"}</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Fld label={"Sale Price"}><Inp value={inp.salePrice} onChange={v=>s("salePrice",v)} placeholder="0" prefix="$"/></Fld>
          <Fld label={"Selling Expenses"} hint={"Commissions, closing costs"} optional optLbl="optional"><Inp value={inp.expenses} onChange={v=>s("expenses",v)} placeholder="0" prefix="$"/></Fld>
          <Fld label={"Original Cost Basis"} hint={"Purchase price + capitalized closing costs"}><Inp value={inp.originalBasis} onChange={v=>s("originalBasis",v)} placeholder="0" prefix="$"/></Fld>
          <Fld label={"Capital Improvements"} optional optLbl="optional"><Inp value={inp.improvements} onChange={v=>s("improvements",v)} placeholder="0" prefix="$"/></Fld>
          <Fld label={"Accumulated Depreciation Claimed"} hint={"Total depreciation taken — recaptured at max 25%"} optional optLbl="optional"><Inp value={inp.depreciation} onChange={v=>s("depreciation",v)} placeholder="0" prefix="$"/></Fld>
          <Fld label={"Remaining Mortgage"} optional optLbl="optional"><Inp value={inp.mortgage} onChange={v=>s("mortgage",v)} placeholder="0" prefix="$"/></Fld>
        </div>
        {/* Show auto-calculated adjusted basis */}
        {(parse(inp.originalBasis)>0)&&(
          <div style={{marginTop:8,padding:"6px 10px",background:"rgba(200,169,110,0.06)",borderRadius:5,fontSize:11,color:T.gold}}>
            {"Adjusted basis = "}
            {fmt(parse(inp.originalBasis))}
            {parse(inp.improvements)>0&&" + "+fmt(parse(inp.improvements))+" improvements"}
            {parse(inp.depreciation)>0&&" − "+fmt(parse(inp.depreciation))+" depreciation"}
            {" = "}
            <strong>{fmt(Math.max(0,parse(inp.originalBasis)+parse(inp.improvements)-parse(inp.depreciation)))}</strong>
          </div>
        )}
      </div>

      {/* Tax Context */}
      <div style={{padding:"10px 14px",background:T.bgCard2,border:"1px solid "+T.border,borderRadius:8,marginBottom:10}}>
        <p style={{fontSize:10,color:T.gold,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",margin:"0 0 10px"}}>{"Your Tax Situation"}</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Fld label={"Filing Status"}><Sel value={inp.fs} onChange={v=>s("fs",v)} options={FS}/></Fld>
          <Fld label={"Estimated AGI (excluding this sale)"} hint={"Used for bracket stacking and NIIT"}><Inp value={inp.agi} onChange={v=>s("agi",v)} placeholder="0" prefix="$"/></Fld>
        </div>
      </div>

      {/* Replacement Property */}
      <div style={{padding:"10px 14px",background:T.bgCard2,border:"1px solid "+T.border,borderRadius:8,marginBottom:12}}>
        <p style={{fontSize:10,color:T.gold,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",margin:"0 0 4px"}}>{"Replacement Property"}</p>
        <p style={{fontSize:10,color:T.textDim,margin:"0 0 10px",fontStyle:"italic"}}>{"Optional — leave blank to see tax if sold normally"}</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Fld label={"Replacement Property Price"} optional optLbl="optional"><Inp value={inp.newPrice} onChange={v=>s("newPrice",v)} placeholder="0" prefix="$"/></Fld>
          <Fld label={"Replacement Property Mortgage"} optional optLbl="optional"><Inp value={inp.newMortgage} onChange={v=>s("newMortgage",v)} placeholder="0" prefix="$"/></Fld>
        </div>
      </div>

      <GoldBtn onClick={doCalc}>{"Analyze 1031 Exchange"}</GoldBtn>

      {res&&(<div style={{marginTop:20}}>
        {/* Eligibility check */}
        {parse(inp.newPrice)>0&&(
          <div style={{padding:"12px 16px",borderRadius:8,marginBottom:12,
            background:res.eligibility==="full"?"rgba(74,144,96,0.12)":res.eligibility==="partial"?"rgba(200,169,110,0.12)":"rgba(192,112,80,0.12)",
            border:"1px solid "+(res.eligibility==="full"?T.green:res.eligibility==="partial"?T.goldDim:T.red)}}>
            <div style={{fontSize:13,fontWeight:700,color:res.eligibility==="full"?T.green:res.eligibility==="partial"?T.gold:T.red,marginBottom:4}}>
              {res.eligibility==="full"&&"✅  Full Deferral Likely — Replacement meets all requirements"}
              {res.eligibility==="partial"&&"⚠️  Partial Taxable Boot — Small amount may be taxable"}
              {res.eligibility==="boot_risk"&&"❌  Boot Risk — Replacement may not defer all tax"}
            </div>
            <div style={{fontSize:11,color:T.textMid}}>
              {res.eligibility==="full"&&"Replacement price ≥ sale price and equity fully reinvested. All gain deferred."}
              {res.eligibility==="partial"&&"Boot of "+fmt(res.boot)+" may be taxable (~"+fmt(res.bootTax)+"). Consider a higher-priced replacement."}
              {res.eligibility==="boot_risk"&&"Mortgage boot of "+fmt(res.mortgageBoot)+" or cash boot of "+fmt(res.equityBoot)+". Taxable gain not fully deferred."}
            </div>
          </div>
        )}

        {/* Key numbers */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
          {[
            {l:"Adjusted Basis",v:fmt(res.adjBasis),sub:"purchase + impr − depr"},
            {l:"Realized Gain",v:fmt(res.realizedGain),sub:"amount realized − basis",hi:true},
            {l:"Tax if Sold Normally",v:fmt(res.taxIfSell),hi:true,sub:"recapture + LTCG + NIIT"},
            {l:"Tax Deferred via 1031",v:fmt(res.taxIfSell),sub:"if fully exchanged",green:true},
            {l:"Min. Replacement Price",v:fmt(res.minNewPrice),sub:"to defer all gain"},
            {l:"Equity to Reinvest",v:fmt(res.minNewEquity),sub:"sale proceeds − mortgage"},
          ].map((it,i)=>(
            <div key={i} style={{background:T.bgCard2,border:"1px solid "+(it.hi?T.goldDim:it.green?"rgba(74,144,96,0.4)":T.border),borderRadius:8,padding:"12px 14px"}}>
              <div style={{fontSize:10,color:T.textDim,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:2}}>{it.l}</div>
              <div style={{fontSize:18,color:it.hi?T.gold:it.green?T.green:T.text,fontWeight:300,marginBottom:2}}>{it.v}</div>
              {it.sub&&<div style={{fontSize:9,color:T.textDim,fontStyle:"italic"}}>{it.sub}</div>}
            </div>
          ))}
        </div>

        {/* Tax breakdown */}
        <div style={{background:T.bgCard2,border:"1px solid "+T.border,borderRadius:8,padding:"14px 16px",marginBottom:10}}>
          <p style={{fontSize:10,color:T.gold,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",margin:"0 0 10px"}}>{"Tax Breakdown if Sold Normally"}</p>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
            <tbody>
              {res.recaptureTax>0&&<tr style={{borderBottom:"1px solid "+T.border}}>
                <td style={{padding:"6px 0",color:T.textMid}}>{"§1250 Depreciation Recapture"}<br/><span style={{fontSize:9,color:T.textDim}}>{fmt(res.recapture)+" @ max 25% rate"}</span></td>
                <td style={{padding:"6px 0",textAlign:"right",color:T.red,fontWeight:500}}>{fmt(res.recaptureTax)}</td>
              </tr>}
              {res.cgT>0&&<tr style={{borderBottom:"1px solid "+T.border}}>
                <td style={{padding:"6px 0",color:T.textMid}}>{"Long-Term Capital Gains Tax"}<br/><span style={{fontSize:9,color:T.textDim}}>{fmt(res.cgGain)+" stacked on "+fmt(parse(inp.agi))+" other income"}</span></td>
                <td style={{padding:"6px 0",textAlign:"right",color:T.red,fontWeight:500}}>{fmt(res.cgT)}</td>
              </tr>}
              {res.niit>0&&<tr style={{borderBottom:"1px solid "+T.border}}>
                <td style={{padding:"6px 0",color:T.textMid}}>{"Net Investment Income Tax (3.8%)"}</td>
                <td style={{padding:"6px 0",textAlign:"right",color:T.red}}>{fmt(res.niit)}</td>
              </tr>}
              <tr style={{background:"rgba(200,169,110,0.06)"}}>
                <td style={{padding:"8px 0",color:T.gold,fontWeight:700}}>{"Total Tax if Sold Normally"}</td>
                <td style={{padding:"8px 0",textAlign:"right",color:T.gold,fontWeight:700,fontSize:15}}>{fmt(res.taxIfSell)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {res.boot>0&&<IBox tone="amber">{"⚠ Boot of "+fmt(res.boot)+" may be immediately taxable (~"+fmt(res.bootTax)+"). Mortgage boot: "+fmt(res.mortgageBoot)+" | Cash boot: "+fmt(res.equityBoot)}</IBox>}
        <IBox>{"💡 A 1031 exchange defers — not eliminates — tax. When you eventually sell without exchanging, deferred gains become taxable. Many investors exchange indefinitely or until death (stepped-up basis eliminates deferred gain)."}</IBox>
        <p style={{fontSize:10,color:T.textDim,marginTop:10,lineHeight:1.5}}>{"Estimates only. 1031 exchanges are complex. Always work with an experienced CPA and qualified intermediary (QI)."}</p>
      </div>)}
    </div>
  );
}

const CALC_LIST=[
  {id:"underpayment",icon:"⚖️",color:T.gold,live:true,
   title:{en:"IRS Underpayment Penalty",vi:"Phạt Thiếu Thuế IRS",es:"Multa IRS por Pago Insuficiente"},
   desc:{en:"Estimate your penalty for underpaying quarterly estimated taxes. Includes Schedule AI for uneven income.",vi:"Ước tính tiền phạt khi không nộp đủ thuế hàng quý. Bao gồm Lịch AI cho thu nhập không đều.",es:"Estime su multa por pago insuficiente de impuestos trimestrales. Incluye Horario AI para ingresos irregulares."},
   badge:{en:"Most used",vi:"Phổ biến nhất",es:"Más usado"}},
  {id:"depreciation",icon:"🏠",color:"#6a9a70",live:true,
   title:{en:"Rental Property Depreciation",vi:"Khấu Hao BĐS Cho Thuê",es:"Depreciación de Propiedad de Alquiler"},
   desc:{en:"Calculate your annual depreciation deduction for residential (27.5 yr) and commercial (39 yr) properties.",vi:"Tính khấu trừ khấu hao hàng năm cho bất động sản dân dụng (27,5 năm) và thương mại (39 năm).",es:"Calcule su deducción anual de depreciación para propiedades residenciales (27.5 años) y comerciales (39 años)."},
   badge:{en:"New",vi:"Mới",es:"Nuevo"}},
  {id:"capitalgains",icon:"📈",color:"#7a8aa0",live:true,
   title:{en:"Capital Gains on Property Sale",vi:"Thuế Lợi Vốn Bán Nhà",es:"Ganancias de Capital en Venta"},
   desc:{en:"Estimate federal capital gains tax including depreciation recapture, primary home exclusion, and NIIT.",vi:"Ước tính thuế lợi vốn liên bang bao gồm hoàn lại khấu hao, miễn trừ nhà ở chính và NIIT.",es:"Estime el impuesto sobre ganancias de capital incluyendo recuperación de depreciación, exclusión de residencia y NIIT."},
   badge:{en:"New",vi:"Mới",es:"Nuevo"}},

  {id:"str",icon:"🏖️",color:"#7a6a9a",live:true,
   title:{en:"Short-Term Rental (Airbnb) Tax",vi:"Thuế Cho Thuê Ngắn Hạn (Airbnb)",es:"Impuesto Alquiler a Corto Plazo"},
   desc:{en:"14-day rule analysis, rental vs personal use allocation, passive loss classification.",vi:"Phân tích quy tắc 14 ngày, phân bổ cho thuê vs sử dụng cá nhân, phân loại tổn thất thụ động.",es:"Análisis de la regla de 14 días, asignación alquiler vs uso personal, clasificación de pérdidas pasivas."},
   badge:{en:"New",vi:"Mới",es:"Nuevo"}},
  {id:"exchange1031",icon:"🔄",color:"#9a8060",live:true,
   title:{en:"1031 Exchange Calculator",vi:"Máy Tính Trao Đổi 1031",es:"Calculadora Intercambio 1031"},
   desc:{en:"Analyze deferred capital gains, boot exposure, minimum replacement property requirements, and cash needed.",vi:"Phân tích lợi vốn hoãn lại, boot, yêu cầu bất động sản thay thế tối thiểu và tiền mặt cần thiết.",es:"Analice ganancias diferidas, exposición al boot, requisitos mínimos de la propiedad de reemplazo."},
   badge:{en:"New",vi:"Mới",es:"Nuevo"}},
];

function CalcWrapper({id,lang}){
  switch(id){
    case "underpayment": return <UnderpaymentCalc lang={lang}/>;
    case "depreciation": return <DepreciationCalc lang={lang}/>;
    case "capitalgains": return <CapGainsCalc lang={lang}/>;
    case "str":          return <STRCalc lang={lang}/>;
    case "exchange1031": return <Exchange1031Calc lang={lang}/>;
    default: return null;
  }
}

// ── HOME PAGE ─────────────────────────────────────────────────────────────────
function HomePage({lang,setPage,setActiveCalc}){
  const L=LANG[lang];
  function goCalc(id){setActiveCalc(id);setPage("calculators");}
  return(<div>
    {/* Hero */}
    <div style={{padding:"72px 0 52px",textAlign:"center",maxWidth:700,margin:"0 auto"}}>
      <div style={{display:"inline-block",fontSize:10,letterSpacing:"0.4em",textTransform:"uppercase",marginBottom:18,color:T.goldDim,border:`1px solid ${T.border}`,borderRadius:20,padding:"5px 16px"}}>{L.hero.eyebrow}</div>
      <h1 style={{margin:"0 0 6px",fontSize:"clamp(34px,5.5vw,58px)",fontWeight:300,letterSpacing:"-0.03em",lineHeight:1.05,color:T.text}}>{L.hero.h1a}</h1>
      <h1 style={{margin:"0 0 22px",fontSize:"clamp(34px,5.5vw,58px)",fontWeight:300,letterSpacing:"-0.03em",lineHeight:1.05,background:`linear-gradient(135deg,${T.gold},${T.goldLight})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{L.hero.h1b}</h1>
      <p style={{fontSize:"clamp(13px,2vw,16px)",color:T.textMid,lineHeight:1.7,marginBottom:32,maxWidth:520,margin:"0 auto 32px"}}>{L.hero.sub}</p>
      <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
        <GoldBtn onClick={()=>setPage("calculators")}>{L.hero.cta}</GoldBtn>
        <OutlineBtn onClick={()=>setPage("shop")}>{L.hero.cta2}</OutlineBtn>
      </div>
      <div style={{display:"flex",gap:20,justifyContent:"center",marginTop:32,flexWrap:"wrap"}}>
        {L.trust.map((t,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:T.textDim}}><span style={{color:T.green,fontSize:12}}>✓</span>{t}</div>)}
      </div>
    </div>

    {/* Calc grid */}
    <div style={{marginBottom:52}}>
      <SectionHeader title={L.calcHub.title} sub={L.calcHub.sub}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:12}}>
        {CALC_LIST.map(c=>(
          <div key={c.id} onClick={()=>goCalc(c.id)}
            style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:10,padding:"18px",cursor:"pointer",transition:"all 0.2s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=T.borderHover;e.currentTarget.style.background=T.bgCardHover;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background=T.bgCard;}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <span style={{fontSize:22}}>{c.icon}</span>
              <span style={{fontSize:9,color:T.green,border:"1px solid #1a4020",borderRadius:3,padding:"2px 6px",letterSpacing:"0.06em",textTransform:"uppercase"}}>{c.badge[lang]||c.badge.en}</span>
            </div>
            <h3 style={{margin:"0 0 6px",fontSize:13,fontWeight:500,color:T.text}}>{c.title[lang]||c.title.en}</h3>
            <p style={{margin:0,fontSize:11,color:T.textMid,lineHeight:1.6}}>{c.desc[lang]||c.desc.en}</p>
          </div>
        ))}
      </div>
    </div>

    {/* Blog preview */}
    <div style={{marginBottom:52}}>
      <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:8}}>
        <div><h2 style={{margin:"0 0 4px",fontSize:"clamp(18px,3vw,26px)",fontWeight:300,color:T.text}}>{L.blog.title}</h2><p style={{margin:0,color:T.textMid,fontSize:12}}>{L.blog.sub}</p></div>
        <button onClick={()=>setPage("blog")} style={{fontSize:12,color:T.gold,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>{L.blog.readMore}</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:12}}>
        {BLOG_POSTS.map((p,i)=>(
          <div key={i} onClick={()=>setPage(`blog-${i}`)} style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:10,padding:"18px",cursor:"pointer",transition:"all 0.2s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=T.borderHover;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;}}>
            <div style={{fontSize:20,marginBottom:10}}>{p.icon}</div>
            <h3 style={{margin:"0 0 6px",fontSize:13,fontWeight:500,color:T.text,lineHeight:1.4}}>{p.title[lang]||p.title.en}</h3>
            <p style={{margin:"0 0 10px",fontSize:11,color:T.textMid,lineHeight:1.6}}>{p.excerpt[lang]||p.excerpt.en}</p>
            <span style={{fontSize:11,color:T.gold}}>{L.blog.readMore}</span>
          </div>
        ))}
      </div>
    </div>

    {/* Shop preview */}
    <div style={{marginBottom:72}}>
      <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:8}}>
        <div><h2 style={{margin:"0 0 4px",fontSize:"clamp(18px,3vw,26px)",fontWeight:300,color:T.text}}>{L.shop.title}</h2><p style={{margin:0,color:T.textMid,fontSize:12}}>{L.shop.sub}</p></div>
        <button onClick={()=>setPage("shop")} style={{fontSize:12,color:T.gold,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>{L.shop.buy}</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:12}}>
        {SHOP_ITEMS.map((it,i)=>(
          <div key={i} style={{background:T.bgCard,border:`1px solid ${i===2?T.goldDim:T.border}`,borderRadius:10,padding:"18px",position:"relative",transition:"all 0.2s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=T.goldDim;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=i===2?T.goldDim:T.border;}}>
            {i===2&&<div style={{position:"absolute",top:-1,right:16,background:T.gold,color:"#050608",fontSize:9,fontWeight:700,letterSpacing:"0.08em",padding:"3px 10px",borderRadius:"0 0 5px 5px",textTransform:"uppercase"}}>{it.badge[lang]||it.badge.en}</div>}
            <div style={{fontSize:22,marginBottom:10}}>{it.icon}</div>
            <h3 style={{margin:"0 0 6px",fontSize:13,fontWeight:500,color:T.text}}>{it.title[lang]||it.title.en}</h3>
            <p style={{margin:"0 0 14px",fontSize:11,color:T.textMid,lineHeight:1.6}}>{it.desc[lang]||it.desc.en}</p>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:20,color:T.gold,fontWeight:300}}>${it.price}</span>
              <a href={it.gumroad} target="_blank" rel="noopener noreferrer"
                style={{padding:"7px 14px",borderRadius:5,fontSize:11,fontFamily:"inherit",cursor:"pointer",fontWeight:600,
                  background:`linear-gradient(135deg,${T.gold},${T.goldLight})`,border:"none",color:"#050608",textDecoration:"none"}}>
                {L.shop.buy}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>);
}

// ── CALCULATORS PAGE ──────────────────────────────────────────────────────────
function CalculatorsPage({lang,activeCalc,setActiveCalc}){
  const L=LANG[lang];
  return(<div style={{padding:"40px 0"}}>
    <SectionHeader title={L.calcHub.title} sub={L.calcHub.sub}/>
    {/* Calc tabs */}
    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:24}}>
      {CALC_LIST.map(c=>(
        <button key={c.id} onClick={()=>setActiveCalc(c.id)}
          style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:6,fontSize:12,
            fontFamily:"inherit",cursor:"pointer",transition:"all 0.15s",
            background:activeCalc===c.id?"rgba(200,169,110,0.12)":T.bgCard,
            border:`1px solid ${activeCalc===c.id?T.gold:T.border}`,
            color:activeCalc===c.id?T.gold:T.textMid}}>
          <span>{c.icon}</span> {c.title[lang]||c.title.en}
        </button>
      ))}
    </div>
    <div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:12,padding:"28px"}}>
      <CalcWrapper id={activeCalc} lang={lang}/>
    </div>
  </div>);
}

// ── BLOG LIST PAGE ────────────────────────────────────────────────────────────
function BlogListPage({lang,setPage}){
  const L=LANG[lang];
  return(<div style={{padding:"40px 0"}}>
    <SectionHeader title={L.blog.title} sub={L.blog.sub}/>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14}}>
      {BLOG_POSTS.map((p,i)=>(
        <div key={i} onClick={()=>setPage(`blog-${i}`)} style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:10,padding:"22px",cursor:"pointer",transition:"all 0.2s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=T.borderHover;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;}}>
          <div style={{fontSize:28,marginBottom:12}}>{p.icon}</div>
          <div style={{fontSize:10,color:T.textDim,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>{p.date}</div>
          <h2 style={{margin:"0 0 8px",fontSize:15,fontWeight:400,color:T.text,lineHeight:1.4}}>{p.title[lang]||p.title.en}</h2>
          <p style={{margin:"0 0 14px",fontSize:12,color:T.textMid,lineHeight:1.6}}>{p.excerpt[lang]||p.excerpt.en}</p>
          <span style={{fontSize:12,color:T.gold}}>{L.blog.readMore}</span>
        </div>
      ))}
    </div>
    <div style={{marginTop:32,padding:"22px",background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:10,textAlign:"center"}}>
      <p style={{color:T.textMid,fontSize:13,margin:"0 0 14px"}}>{lang==="vi"?"Thêm bài viết sắp ra mắt. Đăng ký để nhận thông báo.":lang==="es"?"Más artículos próximamente. Suscríbase.":"More articles coming soon. Subscribe to be notified."}</p>
      <div style={{display:"flex",gap:8,justifyContent:"center",maxWidth:340,margin:"0 auto"}}>
        <input placeholder={lang==="vi"?"Email của bạn":lang==="es"?"Su email":"Your email"} style={{flex:1,background:"#0a0c0f",border:`1px solid ${T.border}`,borderRadius:6,padding:"9px 12px",fontSize:12,color:T.text,fontFamily:"inherit",outline:"none"}}/>
        <GoldBtn>{lang==="vi"?"Đăng ký":lang==="es"?"Suscribirse":"Subscribe"}</GoldBtn>
      </div>
    </div>
  </div>);
}

// ── BLOG POST PAGE ────────────────────────────────────────────────────────────
function BlogPostPage({lang,idx,setPage}){
  const L=LANG[lang];
  const post=BLOG_POSTS[idx];
  if(!post)return null;
  const content=(post.content[lang]||post.content.en).split("\n").filter(Boolean);
  return(<div style={{padding:"40px 0",maxWidth:720,margin:"0 auto"}}>
    <button onClick={()=>setPage("blog")} style={{fontSize:12,color:T.textMid,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",marginBottom:24,padding:0}}>← {lang==="vi"?"Quay lại bài viết":lang==="es"?"Volver a artículos":"Back to articles"}</button>
    <div style={{fontSize:32,marginBottom:16}}>{post.icon}</div>
    <div style={{fontSize:10,color:T.textDim,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12}}>{post.date}</div>
    <h1 style={{margin:"0 0 24px",fontSize:"clamp(20px,4vw,32px)",fontWeight:300,color:T.text,lineHeight:1.3}}>{post.title[lang]||post.title.en}</h1>
    <div style={{fontSize:14,color:T.textMid,lineHeight:1.85}}>
      {content.map((para,i)=>{
        if(para.startsWith("**")&&para.endsWith("**")){
          return <h3 key={i} style={{fontSize:15,fontWeight:500,color:T.text,margin:"24px 0 8px"}}>{para.replace(/\*\*/g,"")}</h3>;
        }
        if(para.startsWith("- ")){
          return <div key={i} style={{display:"flex",gap:8,marginBottom:6}}><span style={{color:T.gold,marginTop:4,flexShrink:0}}>◆</span><span>{para.slice(2)}</span></div>;
        }
        return <p key={i} style={{margin:"0 0 14px"}}>{para}</p>;
      })}
    </div>
    <div style={{marginTop:32,padding:"18px 20px",background:T.bgCard,border:`1px solid ${T.goldDim}`,borderRadius:10}}>
      <p style={{margin:"0 0 12px",fontSize:13,color:T.textMid}}>{lang==="vi"?"Sử dụng các máy tính miễn phí của chúng tôi để áp dụng những điều bạn vừa học.":lang==="es"?"Use nuestras calculadoras gratuitas para aplicar lo que acaba de aprender.":"Use our free calculators to apply what you just learned."}</p>
      <button onClick={()=>setPage("calculators")} style={{fontSize:12,color:T.gold,background:"none",border:`1px solid ${T.goldDim}`,borderRadius:5,cursor:"pointer",fontFamily:"inherit",padding:"7px 14px"}}>{lang==="vi"?"Xem Công Cụ Miễn Phí →":lang==="es"?"Ver Calculadoras Gratuitas →":"View Free Calculators →"}</button>
    </div>
  </div>);
}

// ── SHOP PAGE ─────────────────────────────────────────────────────────────────
function ShopPage({lang}){
  const L=LANG[lang];
  return(<div style={{padding:"40px 0"}}>
    <SectionHeader title={L.shop.title} sub={L.shop.sub}/>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16}}>
      {SHOP_ITEMS.map((it,i)=>(
        <div key={i} style={{background:T.bgCard,border:`1px solid ${i===2?T.goldDim:T.border}`,borderRadius:12,padding:"24px",position:"relative",transition:"all 0.2s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=T.gold;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=i===2?T.goldDim:T.border;}}>
          {i===2&&<div style={{position:"absolute",top:-1,right:20,background:T.gold,color:"#050608",fontSize:9,fontWeight:700,letterSpacing:"0.08em",padding:"4px 12px",borderRadius:"0 0 6px 6px",textTransform:"uppercase"}}>{it.badge[lang]||it.badge.en}</div>}
          <div style={{fontSize:32,marginBottom:14}}>{it.icon}</div>
          <div style={{fontSize:10,color:T.textDim,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>{it.badge[lang]||it.badge.en}</div>
          <h2 style={{margin:"0 0 8px",fontSize:16,fontWeight:400,color:T.text}}>{it.title[lang]||it.title.en}</h2>
          <p style={{margin:"0 0 18px",fontSize:12,color:T.textMid,lineHeight:1.7}}>{it.desc[lang]||it.desc.en}</p>
          <div style={{borderTop:`1px solid ${T.border}`,paddingTop:16,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontSize:26,color:T.gold,fontWeight:300}}>${it.price}</span>
            <a href={it.gumroad} target="_blank" rel="noopener noreferrer"
              style={{padding:"10px 22px",borderRadius:7,fontSize:13,fontFamily:"inherit",cursor:"pointer",fontWeight:600,letterSpacing:"0.04em",
                background:`linear-gradient(135deg,${T.gold},${T.goldLight})`,border:"none",color:"#050608",textDecoration:"none"}}>
              {L.shop.buy}
            </a>
          </div>
        </div>
      ))}
    </div>
    <div style={{marginTop:24,padding:"18px 22px",background:T.accentBg,border:`1px solid #1a2030`,borderRadius:10,textAlign:"center"}}>
      <p style={{color:T.textMid,fontSize:12,margin:0}}>
        {lang==="vi"?"Tất cả sản phẩm được tạo bởi CPA có chứng chỉ. Đảm bảo hài lòng.":lang==="es"?"Todos los productos creados por CPA certificada. Satisfacción garantizada.":"All products created by a licensed CPA specializing in real estate. Satisfaction guaranteed."}
      </p>
    </div>
  </div>);
}

// ── ABOUT PAGE ────────────────────────────────────────────────────────────────
function AboutPage({lang,setPage}){
  const L=LANG[lang].about;
  const creds=[L.cred1,L.cred2,L.cred3,L.cred4];
  return(<div style={{padding:"40px 0",maxWidth:760,margin:"0 auto"}}>
    <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:32,alignItems:"start",marginBottom:40,flexWrap:"wrap"}}>
      <div>
        <div style={{fontSize:10,color:T.textDim,letterSpacing:"0.3em",textTransform:"uppercase",marginBottom:12}}>{L.sub}</div>
        <h1 style={{margin:"0 0 24px",fontSize:"clamp(20px,4vw,32px)",fontWeight:300,color:T.text,lineHeight:1.3}}>{L.h1}</h1>
        <p style={{fontSize:14,color:T.textMid,lineHeight:1.85,marginBottom:14}}>{L.bio1}</p>
        <p style={{fontSize:14,color:T.textMid,lineHeight:1.85,marginBottom:14}}>{L.bio2}</p>
        <p style={{fontSize:14,color:T.textMid,lineHeight:1.85}}>{L.bio3}</p>
      </div>
      <div style={{width:120,height:120,borderRadius:"50%",background:`linear-gradient(135deg,${T.goldDim},#2a2010)`,
        display:"flex",alignItems:"center",justifyContent:"center",fontSize:48,flexShrink:0}}>👩‍💼</div>
    </div>
    <Card>
      <CardTitle>{L.credentials}</CardTitle>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:14}}>
        {creds.map((c,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:T.bgCard2,borderRadius:7,border:`1px solid ${T.border}`}}>
            <span style={{color:T.green,fontSize:14}}>✓</span>
            <span style={{fontSize:13,color:T.textMid}}>{c}</span>
          </div>
        ))}
      </div>
    </Card>
    <div style={{background:`linear-gradient(135deg,#0c0e08,#080a06)`,border:`1px solid ${T.goldDim}`,borderRadius:12,padding:"24px",textAlign:"center"}}>
      <p style={{margin:"0 0 6px",fontSize:16,color:T.text,fontWeight:300}}>{L.contact}</p>
      <p style={{margin:"0 0 18px",fontSize:13,color:T.textMid}}>{L.contactSub}</p>
      <GoldBtn onClick={()=>setPage("contact")}>{lang==="vi"?"Liên Hệ Ngay →":lang==="es"?"Contactar →":"Contact Me →"}</GoldBtn>
    </div>
  </div>);
}

// ── CONTACT PAGE ──────────────────────────────────────────────────────────────
function ContactPage({lang}){
  const L=LANG[lang].contact;
  const [form,setForm]=useState({name:"",email:"",subject:"",message:""});
  const [sent,setSent]=useState(false);
  const s=(k,v)=>setForm(p=>({...p,[k]:v}));
  function submit(){
    if(form.name&&form.email&&form.message){setSent(true);}
  }
  return(<div style={{padding:"40px 0",maxWidth:600,margin:"0 auto"}}>
    <SectionHeader title={L.title} sub={L.sub}/>
    {sent?(
      <Card><IBox tone="green" style={{marginTop:0}}>{L.sent}</IBox></Card>
    ):(
      <Card>
        <Fld label={L.nameL}><Inp value={form.name} onChange={v=>s("name",v)} placeholder={lang==="vi"?"Nguyễn Văn A":lang==="es"?"Juan García":"Jane Smith"}/></Fld>
        <Fld label={L.emailL}><Inp value={form.email} onChange={v=>s("email",v)} placeholder="email@example.com" type="email"/></Fld>
        <Fld label={L.subjectL}>
          <Sel value={form.subject} onChange={v=>s("subject",v)} options={L.subjects.map(s=>({value:s,label:s}))}/>
        </Fld>
        <Fld label={L.msgL}>
          <Textarea value={form.message} onChange={v=>s("message",v)} placeholder={lang==="vi"?"Nhập tin nhắn của bạn...":lang==="es"?"Escriba su mensaje...":"Type your message..."} rows={5}/>
        </Fld>
        <div style={{marginTop:4}}>
          <GoldBtn onClick={submit} full>{L.send}</GoldBtn>
        </div>
        <p style={{fontSize:11,color:T.textDim,marginTop:12,textAlign:"center"}}>
          {lang==="vi"?"Thông tin của bạn sẽ không bao giờ được chia sẻ.":lang==="es"?"Su información nunca será compartida.":"Your information will never be shared."}
        </p>
      </Card>
    )}
    <div style={{marginTop:20,padding:"16px",background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:10}}>
      <p style={{fontSize:12,color:T.textDim,margin:0,textAlign:"center"}}>
        {lang==="vi"?"Thời gian phản hồi: 1–2 ngày làm việc":lang==="es"?"Tiempo de respuesta: 1–2 días hábiles":"Response time: 1–2 business days"}
      </p>
    </div>
  </div>);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App(){
  const [lang,setLang]=useState("en");
  const [page,setPage]=useState("home");
  const [activeCalc,setActiveCalc]=useState("underpayment");
  const [animated,setAnim]=useState(false);
  useEffect(()=>{setTimeout(()=>setAnim(true),60);},[]);
  const L=LANG[lang];

  function nav(p){setPage(p);window.scrollTo({top:0,behavior:"smooth"});}

  const blogMatch=page.match(/^blog-(\d+)$/);
  const blogIdx=blogMatch?parseInt(blogMatch[1]):null;

  return(
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,
      fontFamily:"'Palatino Linotype','Book Antiqua',Palatino,Georgia,serif",
      opacity:animated?1:0,transition:"opacity 0.5s ease"}}>
      <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",
        background:`radial-gradient(ellipse at 10% 20%,rgba(200,169,110,0.04) 0%,transparent 50%),radial-gradient(ellipse at 90% 80%,rgba(74,111,168,0.04) 0%,transparent 50%)`}}/>

      {/* NAV */}
      <nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(7,8,10,0.96)",
        borderBottom:`1px solid ${T.border}`,backdropFilter:"blur(12px)"}}>
        <div style={{maxWidth:1120,margin:"0 auto",padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",height:56}}>
          <div onClick={()=>nav("home")} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:26,height:26,borderRadius:5,background:`linear-gradient(135deg,${T.gold},${T.goldDim})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>⚖</div>
            <span style={{fontSize:14,fontWeight:600,color:T.text,letterSpacing:"0.01em"}}>RealtyTaxTools</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}>
            {Object.entries(L.nav).map(([k,v])=>(
              <button key={k} onClick={()=>nav(k)}
                style={{padding:"5px 12px",borderRadius:5,fontSize:11,fontFamily:"inherit",cursor:"pointer",letterSpacing:"0.06em",textTransform:"uppercase",transition:"all 0.15s",
                  background:(page===k||(!blogMatch&&page===k))?"rgba(200,169,110,0.12)":"transparent",
                  border:`1px solid ${page===k?T.goldDim:"transparent"}`,
                  color:page===k?T.gold:T.textMid}}>
                {v}
              </button>
            ))}
            <div style={{display:"flex",gap:3,marginLeft:8,borderLeft:`1px solid ${T.border}`,paddingLeft:8}}>
              {Object.entries(LANG).map(([code,lt])=>(
                <button key={code} onClick={()=>setLang(code)}
                  style={{padding:"3px 8px",borderRadius:4,fontSize:10,fontFamily:"inherit",cursor:"pointer",transition:"all 0.15s",
                    background:lang===code?"rgba(200,169,110,0.12)":"transparent",
                    border:`1px solid ${lang===code?T.goldDim:"transparent"}`,
                    color:lang===code?T.gold:T.textDim}}>
                  {lt.code}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <div style={{maxWidth:1120,margin:"0 auto",padding:"0 20px",position:"relative",zIndex:1}}>
        {page==="home"&&<HomePage lang={lang} setPage={nav} setActiveCalc={setActiveCalc}/>}
        {page==="calculators"&&<CalculatorsPage lang={lang} activeCalc={activeCalc} setActiveCalc={setActiveCalc}/>}
        {page==="blog"&&<BlogListPage lang={lang} setPage={nav}/>}
        {blogIdx!==null&&<BlogPostPage lang={lang} idx={blogIdx} setPage={nav}/>}
        {page==="shop"&&<ShopPage lang={lang}/>}
        {page==="about"&&<AboutPage lang={lang} setPage={nav}/>}
        {page==="contact"&&<ContactPage lang={lang}/>}
      </div>

      {/* FOOTER */}
      <footer style={{borderTop:`1px solid ${T.border}`,padding:"28px 20px",marginTop:20}}>
        <div style={{maxWidth:1120,margin:"0 auto",display:"flex",flexWrap:"wrap",justifyContent:"space-between",alignItems:"center",gap:14}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:22,height:22,borderRadius:4,background:`linear-gradient(135deg,${T.gold},${T.goldDim})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11}}>⚖</div>
            <span style={{fontSize:12,color:T.textMid}}>RealtyTaxTools</span>
          </div>
          <p style={{fontSize:10,color:T.textDim,margin:0,maxWidth:480,textAlign:"center"}}>{L.footer.disclaimer}</p>
          <p style={{fontSize:10,color:T.textDim,margin:0}}>© 2024 {L.footer.rights}</p>
        </div>
      </footer>
    </div>
  );
}
