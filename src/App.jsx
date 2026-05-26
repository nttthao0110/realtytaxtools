import { useState, useEffect } from "react";

// ── THEME ────────────────────────────────────────────────────────────────────
const T = {
  bg:"#07080a", bgCard:"#0d0f12", bgCard2:"#0a0c0e",
  border:"#1c2028", borderHover:"#2a3040",
  gold:"#c8a96e", goldLight:"#e8c98e", goldDim:"#7a6540",
  text:"#e8e4dc", textMid:"#8a8478", textDim:"#3a3830",
  green:"#4a9060", greenBg:"#0a1a0e",
  red:"#c07050", redBg:"#1a0e0a",
  accent:"#4a6fa8", accentBg:"#0a1020",
  purple:"#8040b0", purpleBg:"#0a0818",
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
  const [inp,setInp]=useState({price:"",land:"",type:"residential",improvements:"",year:""});
  const [res,setRes]=useState(null);
  const s=(k,v)=>setInp(p=>({...p,[k]:v}));
  const TX={
    title:L==="vi"?"Máy Tính Khấu Hao BĐS":L==="es"?"Calculadora de Depreciación":"Rental Property Depreciation",
    sub:L==="vi"?"Tính khấu trừ khấu hao hàng năm":L==="es"?"Calcule su deducción anual de depreciación":"Calculate your annual depreciation deduction",
    priceL:L==="vi"?"Giá mua bất động sản":L==="es"?"Precio de compra de la propiedad":"Property purchase price",
    landL:L==="vi"?"Giá trị đất (không khấu hao)":L==="es"?"Valor del terreno (no depreciable)":"Land value (not depreciable)",
    landH:L==="vi"?"Thường 10–30% tổng giá. Kiểm tra hồ sơ thuế tài sản.":L==="es"?"Generalmente 10–30% del precio total. Verifique registros de impuestos de propiedad.":"Typically 10–30% of total price. Check property tax records.",
    impL:L==="vi"?"Cải thiện bổ sung (tùy chọn)":L==="es"?"Mejoras adicionales (opcional)":"Additional improvements (optional)",
    impH:L==="vi"?"Cải thiện vốn thêm sau khi mua":L==="es"?"Mejoras de capital añadidas después de la compra":"Capital improvements added after purchase",
    typeL:L==="vi"?"Loại bất động sản":L==="es"?"Tipo de propiedad":"Property type",
    types:[
      {value:"residential",label:L==="vi"?"Dân dụng (27.5 năm)":L==="es"?"Residencial (27.5 años)":"Residential (27.5 years)"},
      {value:"commercial",label:L==="vi"?"Thương mại (39 năm)":L==="es"?"Comercial (39 años)":"Commercial (39 years)"},
    ],
    yearL:L==="vi"?"Năm đặt vào sử dụng":L==="es"?"Año de puesta en servicio":"Year placed in service",
    yearH:L==="vi"?"Ảnh hưởng đến khấu hao năm đầu tiên":L==="es"?"Afecta la depreciación del primer año":"Affects first-year depreciation",
    calc:L==="vi"?"Tính Khấu Hao":L==="es"?"Calcular Depreciación":"Calculate Depreciation",
    reset:L==="vi"?"Đặt Lại":L==="es"?"Restablecer":"Reset",
    rBasis:L==="vi"?"Cơ Sở Khấu Hao":L==="es"?"Base Depreciable":"Depreciable Basis",
    rAnnual:L==="vi"?"Khấu Hao Hàng Năm":L==="es"?"Depreciación Anual":"Annual Depreciation",
    rLife:L==="vi"?"Tuổi Thọ Hữu Ích":L==="es"?"Vida Útil":"Useful Life",
    r10:L==="vi"?"Tiết Kiệm Thuế 10 Năm":L==="es"?"Ahorro Fiscal 10 Años":"10-Year Tax Savings (est.)",
    rMethod:L==="vi"?"Phương Pháp":L==="es"?"Método":"Method",
    rNote:L==="vi"?"Lưu ý: Bạn phải hoàn lại khấu hao khi bán (tối đa 25%). Hãy tham khảo CPA trước khi khai báo.":L==="es"?"Nota: Debe recuperar la depreciación al vender (hasta 25%). Consulte un CPA antes de reclamarla.":"Note: You must recapture depreciation when you sell (up to 25%). Consult a CPA before claiming.",
    disc:L==="vi"?"Chỉ ước tính — không phải tư vấn thuế.":L==="es"?"Solo estimaciones — no es asesoramiento fiscal.":"Estimates only — not tax advice.",
  };
  function doCalc(){
    const price=parse(inp.price),land=parse(inp.land),impr=parse(inp.improvements);
    const basis=Math.max(0,(price-land)+impr);
    const life=inp.type==="residential"?27.5:39;
    const annual=basis/life;
    const savings10=annual*10*0.24; // assume 24% bracket
    setRes({basis,life,annual,savings10,type:inp.type});
  }
  return(
    <div>
      <div style={{marginBottom:20}}>
        <h3 style={{margin:"0 0 4px",fontSize:15,fontWeight:400,color:T.gold}}>{TX.title}</h3>
        <p style={{margin:0,fontSize:12,color:T.textDim}}>{TX.sub}</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Fld label={TX.priceL}><Inp value={inp.price} onChange={v=>s("price",v)} placeholder="0" prefix="$"/></Fld>
        <Fld label={TX.landL} hint={TX.landH}><Inp value={inp.land} onChange={v=>s("land",v)} placeholder="0" prefix="$"/></Fld>
        <Fld label={TX.typeL}><Sel value={inp.type} onChange={v=>s("type",v)} options={TX.types}/></Fld>
        <Fld label={TX.yearL} hint={TX.yearH}><Inp value={inp.year} onChange={v=>s("year",v)} placeholder={new Date().getFullYear().toString()}/></Fld>
        <div style={{gridColumn:"1/-1"}}>
          <Fld label={TX.impL} hint={TX.impH} optional optLbl={L==="vi"?"tùy chọn":L==="es"?"opcional":"optional"}><Inp value={inp.improvements} onChange={v=>s("improvements",v)} placeholder="0" prefix="$"/></Fld>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginTop:4}}>
        <GoldBtn onClick={doCalc}>{TX.calc}</GoldBtn>
        <OutlineBtn onClick={()=>{setInp({price:"",land:"",type:"residential",improvements:"",year:""});setRes(null);}}>{TX.reset}</OutlineBtn>
      </div>
      {res&&(<div style={{marginTop:20}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          {[
            {l:TX.rBasis,v:fmt(res.basis),hi:false},
            {l:TX.rAnnual,v:fmt(res.annual),hi:true},
            {l:TX.rLife,v:`${res.life} ${L==="vi"?"năm":L==="es"?"años":"years"}`,hi:false},
            {l:TX.r10,v:fmt(res.savings10),hi:true},
          ].map((it,i)=>(
            <div key={i} style={{background:T.bgCard2,border:`1px solid ${it.hi?T.goldDim:T.border}`,borderRadius:8,padding:"14px 16px"}}>
              <div style={{fontSize:10,color:T.textDim,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:4}}>{it.l}</div>
              <div style={{fontSize:it.hi?22:18,color:it.hi?T.gold:T.text,fontWeight:300}}>{it.v}</div>
            </div>
          ))}
        </div>
        <IBox>
          <strong>{TX.rMethod}:</strong> {L==="vi"?"Đường thẳng (MACRS GDS)":L==="es"?"Línea recta (MACRS GDS)":"Straight-line (MACRS GDS)"} · {L==="vi"?"Cơ sở":L==="es"?"Base":"Basis"}: {fmt(res.basis)} ÷ {res.life} {L==="vi"?"năm":L==="es"?"años":"yrs"} = <strong>{fmt(res.annual)}/yr</strong>
        </IBox>
        <IBox tone="amber">{TX.rNote}</IBox>
        <p style={{fontSize:10,color:T.textDim,marginTop:10,lineHeight:1.5}}>{TX.disc}</p>
      </div>)}
    </div>
  );
}

// ── 3. CAPITAL GAINS ─────────────────────────────────────────────────────────
function CapGainsCalc({lang:L="en"}){
  const [inp,setInp]=useState({salePrice:"",basis:"",improvements:"",depreciation:"",expenses:"",fs:"single",agi:"",primary:false,years:""});
  const [res,setRes]=useState(null);
  const s=(k,v)=>setInp(p=>({...p,[k]:v}));
  const FS=[
    {value:"single",label:L==="vi"?"Độc thân":L==="es"?"Soltero/a":"Single"},
    {value:"mfj",label:L==="vi"?"Vợ chồng chung":L==="es"?"Casado conjunto":"Married Joint"},
    {value:"mfs",label:L==="vi"?"Vợ chồng riêng":L==="es"?"Casado separado":"Married Separate"},
    {value:"hoh",label:L==="vi"?"Chủ hộ":L==="es"?"Jefe hogar":"Head of Household"},
  ];
  const TX={
    title:L==="vi"?"Thuế Lợi Vốn Bán Nhà":L==="es"?"Impuesto Ganancias de Capital":"Capital Gains on Property Sale",
    sub:L==="vi"?"Ước tính thuế lợi vốn liên bang khi bán bất động sản":L==="es"?"Estime el impuesto federal sobre ganancias de capital":"Estimate your federal capital gains tax on property sale",
    salePriceL:L==="vi"?"Giá bán":L==="es"?"Precio de venta":"Sale price",
    basisL:L==="vi"?"Cơ sở chi phí (giá mua gốc)":L==="es"?"Base de costo (precio de compra original)":"Cost basis (original purchase price)",
    impL:L==="vi"?"Cải thiện vốn":L==="es"?"Mejoras de capital":"Capital improvements",
    depL:L==="vi"?"Khấu hao đã tích lũy":L==="es"?"Depreciación acumulada":"Accumulated depreciation claimed",
    depH:L==="vi"?"Khấu hao đã khai báo — sẽ bị hoàn lại ở mức 25%":L==="es"?"Depreciación reclamada — se recupera al 25%":"Depreciation claimed — recaptured at 25%",
    expL:L==="vi"?"Chi phí bán (hoa hồng, phí)":L==="es"?"Gastos de venta (comisiones, honorarios)":"Selling expenses (commissions, fees)",
    fsL:L==="vi"?"Tình trạng khai thuế":L==="es"?"Estado civil":"Filing status",
    agiL:L==="vi"?"AGI dự kiến năm nay (không bao gồm lợi vốn)":L==="es"?"AGI estimado (sin incluir ganancias de capital)":"Estimated AGI this year (excluding capital gains)",
    primaryL:L==="vi"?"Đây là nhà ở chính của tôi":L==="es"?"Esta es mi residencia principal":"This is my primary residence",
    yearsL:L==="vi"?"Số năm đã sở hữu và sống tại đây":L==="es"?"Años de propiedad y residencia":"Years owned and lived there",
    yearsH:L==="vi"?"Cần 2+ năm cho khoản miễn trừ nhà ở chính":L==="es"?"Necesita 2+ años para la exclusión de residencia principal":"Need 2+ years for primary home exclusion",
    calc:L==="vi"?"Tính Thuế Lợi Vốn":L==="es"?"Calcular Impuesto":"Calculate Capital Gains Tax",
    reset:L==="vi"?"Đặt Lại":L==="es"?"Restablecer":"Reset",
    rGain:L==="vi"?"Lợi Vốn Gộp":L==="es"?"Ganancia Bruta":"Gross Gain",
    rExclusion:L==="vi"?"Miễn Trừ Nhà Ở Chính":L==="es"?"Exclusión Residencia Principal":"Primary Home Exclusion",
    rTaxableGain:L==="vi"?"Lợi Vốn Chịu Thuế":L==="es"?"Ganancia Gravable":"Taxable Capital Gain",
    rRecapture:L==="vi"?"Thuế Hoàn Lại Khấu Hao":L==="es"?"Impuesto de Recuperación":"Depreciation Recapture Tax",
    rCGTax:L==="vi"?"Thuế Lợi Vốn":L==="es"?"Impuesto Ganancias Capital":"Capital Gains Tax",
    rNIIT:L==="vi"?"Thuế Đầu Tư Ròng (3.8%)":L==="es"?"Impuesto Inversión Neta (3.8%)":"Net Investment Income Tax (3.8%)",
    rTotal:L==="vi"?"Tổng Thuế Ước Tính":L==="es"?"Total Impuesto Estimado":"Total Estimated Tax",
    disc:L==="vi"?"Chỉ ước tính — không phải tư vấn thuế. Nhiều yếu tố có thể ảnh hưởng đến thuế thực tế của bạn.":L==="es"?"Solo estimaciones. Muchos factores pueden afectar su impuesto real. No es asesoramiento fiscal.":"Estimates only. Many factors may affect your actual tax. Not tax advice.",
  };
  function doCalc(){
    const sale=parse(inp.salePrice),basis=parse(inp.basis),impr=parse(inp.improvements);
    const dep=parse(inp.depreciation),exp=parse(inp.expenses);
    const adjBasis=basis+impr-dep;
    const grossGain=sale-adjBasis-exp;
    let exclusion=0;
    if(inp.primary&&parse(inp.years)>=2){
      exclusion=inp.fs==="mfj"?500000:250000;
    }
    const taxableGain=Math.max(0,grossGain-exclusion);
    const recapture=Math.min(dep,grossGain>0?grossGain:0);
    const recaptureTax=Math.round(recapture*0.25);
    const cgGain=Math.max(0,taxableGain-recapture);
    const agi=parse(inp.agi);
    const cgT=cgTax(cgGain,inp.fs);
    // NIIT: 3.8% on lesser of NII or AGI over threshold (200k single, 250k mfj)
    const niitThr=inp.fs==="mfj"?250000:200000;
    const niit=agi>niitThr?Math.round(Math.min(taxableGain,(agi-niitThr))*0.038):0;
    const total=recaptureTax+cgT+niit;
    setRes({grossGain,exclusion,taxableGain,recapture,recaptureTax,cgGain,cgT,niit,total,adjBasis});
  }
  return(
    <div>
      <div style={{marginBottom:20}}>
        <h3 style={{margin:"0 0 4px",fontSize:15,fontWeight:400,color:T.gold}}>{TX.title}</h3>
        <p style={{margin:0,fontSize:12,color:T.textDim}}>{TX.sub}</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Fld label={TX.salePriceL}><Inp value={inp.salePrice} onChange={v=>s("salePrice",v)} placeholder="0" prefix="$"/></Fld>
        <Fld label={TX.basisL}><Inp value={inp.basis} onChange={v=>s("basis",v)} placeholder="0" prefix="$"/></Fld>
        <Fld label={TX.impL} optional optLbl={L==="vi"?"tùy chọn":L==="es"?"opcional":"optional"}><Inp value={inp.improvements} onChange={v=>s("improvements",v)} placeholder="0" prefix="$"/></Fld>
        <Fld label={TX.depL} hint={TX.depH} optional optLbl={L==="vi"?"tùy chọn":L==="es"?"opcional":"optional"}><Inp value={inp.depreciation} onChange={v=>s("depreciation",v)} placeholder="0" prefix="$"/></Fld>
        <Fld label={TX.expL} optional optLbl={L==="vi"?"tùy chọn":L==="es"?"opcional":"optional"}><Inp value={inp.expenses} onChange={v=>s("expenses",v)} placeholder="0" prefix="$"/></Fld>
        <Fld label={TX.fsL}><Sel value={inp.fs} onChange={v=>s("fs",v)} options={FS}/></Fld>
        <div style={{gridColumn:"1/-1"}}>
          <Fld label={TX.agiL}><Inp value={inp.agi} onChange={v=>s("agi",v)} placeholder="0" prefix="$"/></Fld>
        </div>
        <div style={{gridColumn:"1/-1"}}>
          <div onClick={()=>s("primary",!inp.primary)} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"10px 14px",borderRadius:7,
            background:inp.primary?"rgba(200,169,110,0.08)":T.bgCard,border:`1px solid ${inp.primary?T.goldDim:T.border}`,transition:"all 0.15s"}}>
            <div style={{width:18,height:18,borderRadius:4,border:`1px solid ${inp.primary?T.gold:T.border}`,background:inp.primary?T.gold:"transparent",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#050608",flexShrink:0}}>
              {inp.primary&&"✓"}
            </div>
            <span style={{fontSize:13,color:inp.primary?T.gold:T.textMid}}>{TX.primaryL}</span>
          </div>
        </div>
        {inp.primary&&(
          <div style={{gridColumn:"1/-1"}}>
            <Fld label={TX.yearsL} hint={TX.yearsH}><Inp value={inp.years} onChange={v=>s("years",v)} placeholder="0"/></Fld>
          </div>
        )}
      </div>
      <div style={{display:"flex",gap:8,marginTop:4}}>
        <GoldBtn onClick={doCalc}>{TX.calc}</GoldBtn>
        <OutlineBtn onClick={()=>{setInp({salePrice:"",basis:"",improvements:"",depreciation:"",expenses:"",fs:"single",agi:"",primary:false,years:""});setRes(null);}}>{TX.reset}</OutlineBtn>
      </div>
      {res&&(<div style={{marginTop:20}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
          {[
            {l:TX.rGain,v:fmt(res.grossGain),hi:false},
            {l:TX.rExclusion,v:fmt(res.exclusion),hi:false,green:true},
            {l:TX.rTaxableGain,v:fmt(res.taxableGain),hi:res.taxableGain>0},
            {l:TX.rRecapture,v:fmt(res.recaptureTax),hi:res.recaptureTax>0},
            {l:TX.rCGTax,v:fmt(res.cgT),hi:res.cgT>0},
            {l:TX.rNIIT,v:fmt(res.niit),hi:res.niit>0},
          ].map((it,i)=>(
            <div key={i} style={{background:T.bgCard2,border:`1px solid ${it.hi?T.goldDim:T.border}`,borderRadius:8,padding:"12px 14px"}}>
              <div style={{fontSize:10,color:T.textDim,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:3}}>{it.l}</div>
              <div style={{fontSize:16,color:it.hi?T.gold:it.green?T.green:T.text,fontWeight:300}}>{it.v}</div>
            </div>
          ))}
        </div>
        <div style={{background:res.total>0?T.redBg:T.greenBg,border:`1px solid ${res.total>0?"#3a1a0a":"#1a4020"}`,borderRadius:10,padding:"18px 20px",textAlign:"center",marginBottom:12}}>
          <div style={{fontSize:10,letterSpacing:"0.3em",textTransform:"uppercase",color:res.total>0?"#8a5020":"#2a6030",marginBottom:6}}>{TX.rTotal}</div>
          <div style={{fontSize:"clamp(32px,6vw,48px)",fontWeight:300,color:res.total>0?T.gold:T.green,letterSpacing:"-0.02em"}}>{fmt(res.total)}</div>
        </div>
        {res.exclusion>0&&<IBox tone="green">{L==="vi"?"✓ Miễn trừ nhà ở chính được áp dụng":L==="es"?"✓ Exclusión de residencia principal aplicada":"✓ Primary home exclusion applied"}: {fmt(res.exclusion)}</IBox>}
        {res.niit>0&&<IBox tone="amber">{L==="vi"?"NIIT 3.8% áp dụng — AGI của bạn vượt ngưỡng đầu tư ròng.":L==="es"?"NIIT 3.8% aplicado — su AGI supera el umbral de ingresos netos de inversión.":"NIIT 3.8% applies — your AGI exceeds the net investment income threshold."}</IBox>}
        <p style={{fontSize:10,color:T.textDim,marginTop:10,lineHeight:1.5}}>{TX.disc}</p>
      </div>)}
    </div>
  );
}

// ── 4. AGENT TAX ──────────────────────────────────────────────────────────────
function AgentTaxCalc({lang:L="en"}){
  const [inp,setInp]=useState({income:"",expenses:"",homeOfficeSqft:"",totalSqft:"",vehicle:"",mileage:"",fs:"single"});
  const [res,setRes]=useState(null);
  const s=(k,v)=>setInp(p=>({...p,[k]:v}));
  const TX={
    title:L==="vi"?"Ước Tính Thuế Môi Giới BĐS":L==="es"?"Estimador de Impuestos para Agentes":"Real Estate Agent Tax Estimator",
    sub:L==="vi"?"Ước tính thuế cho môi giới 1099 bao gồm SE tax và khấu trừ phổ biến":L==="es"?"Estime impuestos para agentes 1099 incluyendo SE tax y deducciones comunes":"Estimate taxes for 1099 agents including SE tax and common deductions",
    incL:L==="vi"?"Tổng hoa hồng & thu nhập":L==="es"?"Total comisiones e ingresos":"Total commissions & income",
    expL:L==="vi"?"Tổng chi phí kinh doanh":L==="es"?"Gastos comerciales totales":"Total business expenses",
    expH:L==="vi"?"Marketing, MLS, E&O, phí hiệp hội, v.v.":L==="es"?"Marketing, MLS, E&O, cuotas de asociación, etc.":"Marketing, MLS, E&O insurance, association dues, etc.",
    hoSqftL:L==="vi"?"Diện tích văn phòng tại nhà (sqft)":L==="es"?"Pies cuadrados de oficina en casa":"Home office square footage",
    totSqftL:L==="vi"?"Tổng diện tích nhà (sqft)":L==="es"?"Pies cuadrados totales del hogar":"Total home square footage",
    vehL:L==="vi"?"Phương pháp khấu trừ xe hơi":L==="es"?"Método de deducción de vehículo":"Vehicle deduction method",
    vehTypes:[
      {value:"mileage",label:L==="vi"?"Tỷ lệ km chuẩn (67¢/dặm)":L==="es"?"Tarifa estándar de millas (67¢/milla)":"Standard mileage rate (67¢/mile)"},
      {value:"actual",label:L==="vi"?"Chi phí thực tế":L==="es"?"Gastos reales":"Actual expenses"},
      {value:"none",label:L==="vi"?"Không có":L==="es"?"Ninguno":"None"},
    ],
    mileL:L==="vi"?"Số dặm kinh doanh":L==="es"?"Millas de negocio":"Business miles driven",
    fsL:L==="vi"?"Tình trạng khai thuế":L==="es"?"Estado civil":"Filing status",
    FS:[
      {value:"single",label:L==="vi"?"Độc thân":L==="es"?"Soltero/a":"Single"},
      {value:"mfj",label:L==="vi"?"Vợ chồng chung":L==="es"?"Casado conjunto":"Married Joint"},
    ],
    calc:L==="vi"?"Ước Tính Thuế":L==="es"?"Estimar Impuestos":"Estimate Taxes",
    reset:L==="vi"?"Đặt Lại":L==="es"?"Restablecer":"Reset",
    rGross:L==="vi"?"Thu Nhập Gộp":L==="es"?"Ingreso Bruto":"Gross Income",
    rDeduct:L==="vi"?"Tổng Khấu Trừ":L==="es"?"Total Deducciones":"Total Deductions",
    rNet:L==="vi"?"Thu Nhập Ròng Kinh Doanh":L==="es"?"Ingreso Neto de Negocio":"Net Business Income",
    rSE:L==="vi"?"Thuế SE (15.3%)":L==="es"?"Impuesto SE (15.3%)":"SE Tax (15.3%)",
    rIncomeTax:L==="vi"?"Thuế Thu Nhập Ước Tính":L==="es"?"Impuesto Sobre la Renta Estimado":"Estimated Income Tax",
    rTotal:L==="vi"?"Tổng Thuế Ước Tính":L==="es"?"Total Impuesto Estimado":"Total Estimated Tax",
    rQtrly:L==="vi"?"Thanh Toán Hàng Quý (÷4)":L==="es"?"Pago Trimestral (÷4)":"Quarterly Payment Needed (÷4)",
    disc:L==="vi"?"Chỉ ước tính — không phải tư vấn thuế.":L==="es"?"Solo estimaciones — no asesoramiento fiscal.":"Estimates only — not tax advice.",
  };
  function doCalc(){
    const income=parse(inp.income),exp=parse(inp.expenses);
    const hoSqft=parse(inp.homeOfficeSqft),totSqft=parse(inp.totalSqft);
    const mileage=parse(inp.mileage);
    const homeOfficePct=totSqft>0?hoSqft/totSqft:0;
    // Estimate home office deduction (simplified method: $5/sqft, max 300 sqft)
    const homeOffice=hoSqft>0?Math.min(hoSqft,300)*5:0;
    const vehicleDeduct=inp.vehicle==="mileage"?mileage*0.67:0;
    const totalDeductions=exp+homeOffice+vehicleDeduct;
    const netIncome=Math.max(0,income-totalDeductions);
    const seTax=Math.round(netIncome*0.9235*0.153);
    const seDeduct=seTax/2;
    const taxable=Math.max(0,netIncome-seDeduct-(STD_DED[inp.fs]||14600));
    const incomeTax=estTax(taxable,inp.fs);
    const total=seTax+incomeTax;
    setRes({income,totalDeductions,netIncome,seTax,incomeTax,total,homeOffice,vehicleDeduct,homeOfficePct});
  }
  return(
    <div>
      <div style={{marginBottom:20}}>
        <h3 style={{margin:"0 0 4px",fontSize:15,fontWeight:400,color:T.gold}}>{TX.title}</h3>
        <p style={{margin:0,fontSize:12,color:T.textDim}}>{TX.sub}</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Fld label={TX.incL}><Inp value={inp.income} onChange={v=>s("income",v)} placeholder="0" prefix="$"/></Fld>
        <Fld label={TX.expL} hint={TX.expH}><Inp value={inp.expenses} onChange={v=>s("expenses",v)} placeholder="0" prefix="$"/></Fld>
        <Fld label={TX.hoSqftL} optional optLbl={L==="vi"?"tùy chọn":"optional"}><Inp value={inp.homeOfficeSqft} onChange={v=>s("homeOfficeSqft",v)} placeholder="0"/></Fld>
        <Fld label={TX.totSqftL} optional optLbl={L==="vi"?"tùy chọn":"optional"}><Inp value={inp.totalSqft} onChange={v=>s("totalSqft",v)} placeholder="0"/></Fld>
        <Fld label={TX.vehL}><Sel value={inp.vehicle} onChange={v=>s("vehicle",v)} options={TX.vehTypes}/></Fld>
        {inp.vehicle==="mileage"&&<Fld label={TX.mileL}><Inp value={inp.mileage} onChange={v=>s("mileage",v)} placeholder="0"/></Fld>}
        <Fld label={TX.fsL}><Sel value={inp.fs} onChange={v=>s("fs",v)} options={TX.FS}/></Fld>
      </div>
      <div style={{display:"flex",gap:8,marginTop:4}}>
        <GoldBtn onClick={doCalc}>{TX.calc}</GoldBtn>
        <OutlineBtn onClick={()=>{setInp({income:"",expenses:"",homeOfficeSqft:"",totalSqft:"",vehicle:"mileage",mileage:"",fs:"single"});setRes(null);}}>{TX.reset}</OutlineBtn>
      </div>
      {res&&(<div style={{marginTop:20}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
          {[
            {l:TX.rGross,v:fmt(res.income)},{l:TX.rDeduct,v:fmt(res.totalDeductions),green:true},
            {l:TX.rNet,v:fmt(res.netIncome)},{l:TX.rSE,v:fmt(res.seTax),hi:true},
            {l:TX.rIncomeTax,v:fmt(res.incomeTax),hi:true},{l:TX.rQtrly,v:fmt(res.total/4),hi:true},
          ].map((it,i)=>(
            <div key={i} style={{background:T.bgCard2,border:`1px solid ${it.hi?T.goldDim:T.border}`,borderRadius:8,padding:"12px 14px"}}>
              <div style={{fontSize:10,color:T.textDim,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:3}}>{it.l}</div>
              <div style={{fontSize:it.hi?20:16,color:it.hi?T.gold:it.green?T.green:T.text,fontWeight:300}}>{it.v}</div>
            </div>
          ))}
        </div>
        <div style={{background:T.redBg,border:"1px solid #3a1a0a",borderRadius:10,padding:"16px 20px",textAlign:"center",marginBottom:12}}>
          <div style={{fontSize:9,letterSpacing:"0.3em",textTransform:"uppercase",color:"#8a5020",marginBottom:6}}>{TX.rTotal}</div>
          <div style={{fontSize:"clamp(30px,5vw,44px)",fontWeight:300,color:T.gold,letterSpacing:"-0.02em"}}>{fmt(res.seTax+res.incomeTax)}</div>
        </div>
        {res.homeOffice>0&&<IBox tone="green">{L==="vi"?"✓ Khấu trừ văn phòng tại nhà":L==="es"?"✓ Deducción oficina en casa":"✓ Home office deduction"}: {fmt(res.homeOffice)} ({L==="vi"?"phương pháp đơn giản":L==="es"?"método simplificado":"simplified method"})</IBox>}
        {res.vehicleDeduct>0&&<IBox tone="green">{L==="vi"?"✓ Khấu trừ xe hơi":L==="es"?"✓ Deducción de vehículo":"✓ Vehicle deduction"}: {fmt(res.vehicleDeduct)}</IBox>}
        <p style={{fontSize:10,color:T.textDim,marginTop:10,lineHeight:1.5}}>{TX.disc}</p>
      </div>)}
    </div>
  );
}

// ── 5. SHORT TERM RENTAL ──────────────────────────────────────────────────────
function STRCalc({lang:L="en"}){
  const [inp,setInp]=useState({rentalDays:"",personalDays:"",income:"",expenses:"",fairRentDays:"",fs:"single"});
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
    const rd=parse(inp.rentalDays),pd=parse(inp.personalDays);
    const inc=parse(inp.income),exp=parse(inp.expenses);
    const total=rd+pd;
    const rentalPct=total>0?rd/total:0;
    const deductibleExp=exp*rentalPct;
    const taxableIncome=Math.max(0,inc-deductibleExp);
    // 14-day rule check
    const rule14=rd<=14&&rd>0;
    // Predominant use: if personal > greater of 14 days or 10% of rental days
    const personalThreshold=Math.max(14,rd*0.10);
    const isPassive=pd>personalThreshold;
    const seTax=!isPassive&&!rule14?Math.round(taxableIncome*0.9235*0.153):0;
    setRes({rd,pd,inc,exp,rentalPct,deductibleExp,taxableIncome,rule14,isPassive,seTax,total});
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
      </div>
      <div style={{display:"flex",gap:8,marginTop:4}}>
        <GoldBtn onClick={doCalc}>{TX.calc}</GoldBtn>
        <OutlineBtn onClick={()=>{setInp({rentalDays:"",personalDays:"",income:"",expenses:"",fairRentDays:"",fs:"single"});setRes(null);}}>{TX.reset}</OutlineBtn>
      </div>
      {res&&(<div style={{marginTop:20}}>
        {res.rule14&&<IBox tone="green">
          <strong>{L==="vi"?"✓ Quy Tắc 14 Ngày Được Áp Dụng":L==="es"?"✓ Regla de 14 Días Aplicada":"✓ 14-Day Rule Applies"}</strong><br/>
          {L==="vi"?"Bạn cho thuê 14 ngày hoặc ít hơn. Thu nhập cho thuê này KHÔNG phải khai báo thuế thu nhập liên bang!":L==="es"?"Alquiló 14 días o menos. ¡Este ingreso de alquiler NO se reporta en impuestos federales sobre la renta!":"You rented 14 days or fewer. This rental income is NOT reportable for federal income tax!"}
        </IBox>}
        {!res.rule14&&(<>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            {[
              {l:L==="vi"?"Tỷ Lệ Cho Thuê":L==="es"?"% de Alquiler":"Rental %",v:pct(res.rentalPct)},
              {l:L==="vi"?"Chi Phí Được Khấu Trừ":L==="es"?"Gastos Deducibles":"Deductible Expenses",v:fmt(res.deductibleExp),green:true},
              {l:L==="vi"?"Thu Nhập Chịu Thuế":L==="es"?"Ingreso Gravable":"Taxable Income",v:fmt(res.taxableIncome),hi:true},
              {l:L==="vi"?"SE Tax":L==="es"?"Impuesto SE":"SE Tax",v:res.seTax>0?fmt(res.seTax):"$0",hi:res.seTax>0},
            ].map((it,i)=>(
              <div key={i} style={{background:T.bgCard2,border:`1px solid ${it.hi?T.goldDim:T.border}`,borderRadius:8,padding:"12px 14px"}}>
                <div style={{fontSize:10,color:T.textDim,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:3}}>{it.l}</div>
                <div style={{fontSize:17,color:it.hi?T.gold:it.green?T.green:T.text,fontWeight:300}}>{it.v}</div>
              </div>
            ))}
          </div>
          <IBox tone={res.isPassive?"amber":undefined}>
            {res.isPassive
              ?<>{L==="vi"?"⚠ Sử dụng cá nhân của bạn vượt ngưỡng — được phân loại là nhà nghỉ dưỡng. Tổn thất bị hạn chế.":L==="es"?"⚠ Su uso personal supera el umbral — clasificado como vivienda de vacaciones. Pérdidas limitadas.":"⚠ Your personal use exceeds the threshold — classified as vacation home. Losses are limited."}</>
              :<>{L==="vi"?"✓ Hoạt động cho thuê — tổn thất có thể áp dụng với thu nhập thụ động khác (tùy thuộc vào quy tắc PAL).":L==="es"?"✓ Actividad de alquiler — las pérdidas pueden compensar otros ingresos pasivos (sujeto a reglas PAL).":"✓ Rental activity — losses may offset other passive income (subject to PAL rules)."}</>
            }
          </IBox>
        </>)}
        <p style={{fontSize:10,color:T.textDim,marginTop:10,lineHeight:1.5}}>{L==="vi"?"Chỉ ước tính — không phải tư vấn thuế.":L==="es"?"Solo estimaciones — no asesoramiento fiscal.":"Estimates only — not tax advice."}</p>
      </div>)}
    </div>
  );
}

// ── 6. 1031 EXCHANGE ──────────────────────────────────────────────────────────
function Exchange1031Calc({lang:L="en"}){
  const [inp,setInp]=useState({salePrice:"",basis:"",depreciation:"",mortgage:"",expenses:"",newPrice:"",newMortgage:"",fs:"single",agi:""});
  const [res,setRes]=useState(null);
  const s=(k,v)=>setInp(p=>({...p,[k]:v}));
  const TX={
    title:L==="vi"?"Máy Tính Trao Đổi 1031":L==="es"?"Calculadora Intercambio 1031":"1031 Exchange Calculator",
    sub:L==="vi"?"Ước tính lợi vốn hoãn lại và yêu cầu cho trao đổi hoãn lại đủ điều kiện":L==="es"?"Estime ganancias de capital diferidas y requisitos para un intercambio calificado":"Estimate deferred capital gains and requirements for a qualified like-kind exchange",
    sale:L==="vi"?"Giá bán bất động sản đang bán":L==="es"?"Precio de venta de la propiedad cedida":"Sale price of relinquished property",
    basis:L==="vi"?"Cơ sở điều chỉnh (sau khấu hao)":L==="es"?"Base ajustada (después de depreciación)":"Adjusted basis (after depreciation)",
    dep:L==="vi"?"Khấu hao đã khai báo":L==="es"?"Depreciación reclamada":"Depreciation claimed",
    mort:L==="vi"?"Nợ thế chấp còn lại":L==="es"?"Deuda hipotecaria restante":"Remaining mortgage debt",
    exp:L==="vi"?"Chi phí bán":L==="es"?"Gastos de venta":"Selling expenses",
    newP:L==="vi"?"Giá bất động sản thay thế":L==="es"?"Precio de la propiedad de reemplazo":"Replacement property price",
    newM:L==="vi"?"Nợ thế chấp bất động sản mới":L==="es"?"Hipoteca de la propiedad de reemplazo":"Replacement property mortgage",
    fsL:L==="vi"?"Tình trạng khai thuế":L==="es"?"Estado civil":"Filing status",
    agiL:L==="vi"?"AGI dự kiến":L==="es"?"AGI estimado":"Estimated AGI",
    calc:L==="vi"?"Phân Tích Trao Đổi 1031":L==="es"?"Analizar Intercambio 1031":"Analyze 1031 Exchange",
    reset:L==="vi"?"Đặt Lại":L==="es"?"Restablecer":"Reset",
    FS:[{value:"single",label:L==="vi"?"Độc thân":L==="es"?"Soltero/a":"Single"},{value:"mfj",label:L==="vi"?"VCK chung":L==="es"?"Casado conjunto":"Married Joint"}],
  };
  function doCalc(){
    const sp=parse(inp.salePrice),b=parse(inp.basis),dep=parse(inp.depreciation);
    const mort=parse(inp.mortgage),exp=parse(inp.expenses);
    const newP=parse(inp.newPrice),newM=parse(inp.newMortgage);
    const gain=sp-b-exp;
    const netEquity=sp-mort-exp;
    // Boot analysis
    const mortgageBoot=Math.max(0,mort-newM);
    const cashNeeded=Math.max(0,netEquity-(newP-newM));
    const boot=mortgageBoot;
    const fullyDeferred=newP>=sp&&newM>=mort;
    // If fully deferred, no tax now
    const recaptureTax=dep>0?Math.round(Math.min(dep,gain)*0.25):0;
    const cgGain=Math.max(0,gain-dep);
    const cgT=cgTax(cgGain,inp.fs);
    const niitThr=inp.fs==="mfj"?250000:200000;
    const agi=parse(inp.agi);
    const niit=agi>niitThr?Math.round(Math.min(gain,(agi-niitThr))*0.038):0;
    const taxIfSell=recaptureTax+cgT+niit;
    const bootTax=Math.round(Math.min(boot/sp,1)*taxIfSell);
    setRes({gain,fullyDeferred,taxIfSell,boot,bootTax,netEquity,cashNeeded,mortgageBoot,
      minNewPrice:sp,minNewEquity:netEquity,dep,recaptureTax,cgT,niit});
  }
  return(
    <div>
      <div style={{marginBottom:20}}>
        <h3 style={{margin:"0 0 4px",fontSize:15,fontWeight:400,color:T.gold}}>{TX.title}</h3>
        <p style={{margin:0,fontSize:12,color:T.textDim}}>{TX.sub}</p>
      </div>
      <div style={{marginBottom:14,padding:"12px 14px",background:T.accentBg,border:`1px solid #1a2030`,borderRadius:8,fontSize:12,color:T.accent}}>
        {L==="vi"?"Trao đổi 1031 cho phép hoãn lại thuế lợi vốn khi tái đầu tư vào bất động sản tương tự. Phải sử dụng QI (intermediary đủ điều kiện). Bất động sản thay thế phải được xác định trong 45 ngày và đóng cửa trong 180 ngày.":L==="es"?"El intercambio 1031 permite diferir el impuesto sobre ganancias de capital al reinvertir en una propiedad similar. Debe usar un QI (intermediario calificado). La propiedad de reemplazo debe identificarse en 45 días y cerrarse en 180 días.":"A 1031 exchange allows you to defer capital gains tax by reinvesting in like-kind property. Must use a QI (qualified intermediary). Replacement property must be identified within 45 days and closed within 180 days."}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Fld label={TX.sale}><Inp value={inp.salePrice} onChange={v=>s("salePrice",v)} placeholder="0" prefix="$"/></Fld>
        <Fld label={TX.basis}><Inp value={inp.basis} onChange={v=>s("basis",v)} placeholder="0" prefix="$"/></Fld>
        <Fld label={TX.dep} optional optLbl={L==="vi"?"tùy chọn":"optional"}><Inp value={inp.depreciation} onChange={v=>s("depreciation",v)} placeholder="0" prefix="$"/></Fld>
        <Fld label={TX.mort} optional optLbl={L==="vi"?"tùy chọn":"optional"}><Inp value={inp.mortgage} onChange={v=>s("mortgage",v)} placeholder="0" prefix="$"/></Fld>
        <Fld label={TX.exp} optional optLbl={L==="vi"?"tùy chọn":"optional"}><Inp value={inp.expenses} onChange={v=>s("expenses",v)} placeholder="0" prefix="$"/></Fld>
        <Fld label={TX.fsL}><Sel value={inp.fs} onChange={v=>s("fs",v)} options={TX.FS}/></Fld>
        <Fld label={TX.agiL}><Inp value={inp.agi} onChange={v=>s("agi",v)} placeholder="0" prefix="$"/></Fld>
      </div>
      <div style={{borderTop:`1px solid ${T.border}`,marginTop:4,paddingTop:16,marginBottom:12}}>
        <p style={{fontSize:11,color:T.textDim,margin:"0 0 10px"}}>{L==="vi"?"Bất động sản thay thế (để phân tích boot):":L==="es"?"Propiedad de reemplazo (para análisis de boot):":"Replacement property (for boot analysis):"}</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Fld label={TX.newP} optional optLbl={L==="vi"?"tùy chọn":"optional"}><Inp value={inp.newPrice} onChange={v=>s("newPrice",v)} placeholder="0" prefix="$"/></Fld>
          <Fld label={TX.newM} optional optLbl={L==="vi"?"tùy chọn":"optional"}><Inp value={inp.newMortgage} onChange={v=>s("newMortgage",v)} placeholder="0" prefix="$"/></Fld>
        </div>
      </div>
      <div style={{display:"flex",gap:8}}>
        <GoldBtn onClick={doCalc}>{TX.calc}</GoldBtn>
        <OutlineBtn onClick={()=>{setInp({salePrice:"",basis:"",depreciation:"",mortgage:"",expenses:"",newPrice:"",newMortgage:"",fs:"single",agi:""});setRes(null);}}>{TX.reset}</OutlineBtn>
      </div>
      {res&&(<div style={{marginTop:20}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
          {[
            {l:L==="vi"?"Lợi Vốn":L==="es"?"Ganancia Capital":"Capital Gain",v:fmt(res.gain)},
            {l:L==="vi"?"Thuế Nếu Bán Thông Thường":L==="es"?"Impuesto si Vende Normal":"Tax if Sold Normally",v:fmt(res.taxIfSell),hi:true},
            {l:L==="vi"?"Giá Tối Thiểu Để Hoãn Toàn Bộ":L==="es"?"Precio Mínimo para Diferir Todo":"Min Price to Defer All",v:fmt(res.minNewPrice)},
            {l:L==="vi"?"Tiền Mặt Cần Đầu Tư":L==="es"?"Efectivo Necesario":"Cash to Invest",v:fmt(res.minNewEquity)},
          ].map((it,i)=>(
            <div key={i} style={{background:T.bgCard2,border:`1px solid ${it.hi?T.goldDim:T.border}`,borderRadius:8,padding:"12px 14px"}}>
              <div style={{fontSize:10,color:T.textDim,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:3}}>{it.l}</div>
              <div style={{fontSize:it.hi?20:16,color:it.hi?T.gold:T.text,fontWeight:300}}>{it.v}</div>
            </div>
          ))}
        </div>
        <IBox tone="green">
          <strong>{L==="vi"?"✓ Thuế Hoãn Lại Tối Đa":L==="es"?"✓ Impuesto Máximo Diferido":"✓ Maximum Tax Deferral"}: {fmt(res.taxIfSell)}</strong><br/>
          {L==="vi"?"Để hoãn toàn bộ: mua bất động sản thay thế ≥":L==="es"?"Para diferir todo: compre una propiedad de reemplazo ≥":"To defer all: purchase replacement property ≥"} {fmt(res.minNewPrice)} {L==="vi"?"và đầu tư tất cả vốn":L==="es"?"e invierta todo el capital":"and reinvest all equity"}
        </IBox>
        {res.boot>0&&<IBox tone="amber">
          ⚠ {L==="vi"?"Boot ước tính":L==="es"?"Boot estimado":"Estimated boot"}: {fmt(res.boot)} — {L==="vi"?"phần này có thể chịu thuế ngay":L==="es"?"esta parte puede estar sujeta a impuestos inmediatamente":"this portion may be immediately taxable"} (≈ {fmt(res.bootTax)})
        </IBox>}
        <p style={{fontSize:10,color:T.textDim,marginTop:10,lineHeight:1.5}}>{L==="vi"?"Chỉ ước tính — không phải tư vấn thuế. Trao đổi 1031 rất phức tạp. Luôn làm việc với CPA và QI có kinh nghiệm.":L==="es"?"Solo estimaciones. Los intercambios 1031 son complejos. Trabaje siempre con un CPA y QI con experiencia.":"Estimates only. 1031 exchanges are complex. Always work with an experienced CPA and qualified intermediary."}</p>
      </div>)}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGES
// ═══════════════════════════════════════════════════════════════════════════════

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
  {id:"agenttax",icon:"💼",color:"#9a7a60",live:true,
   title:{en:"Real Estate Agent Tax Estimator",vi:"Ước Tính Thuế Môi Giới BĐS",es:"Estimador Impuestos para Agentes"},
   desc:{en:"1099 agent tax estimator with SE tax, home office, vehicle deductions, and quarterly payment breakdown.",vi:"Ước tính thuế cho môi giới 1099 với SE tax, văn phòng tại nhà, khấu trừ xe hơi và phân tích hàng quý.",es:"Estimador para agentes 1099 con SE tax, oficina en casa, deducción de vehículo y pagos trimestrales."},
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
    case "agenttax":     return <AgentTaxCalc lang={lang}/>;
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
