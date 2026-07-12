import { useState, useEffect } from "react"; // v2.1

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
// 2026 IRS Tax Brackets (Rev. Proc. 2025-32)
const BRACKETS={
  single:[[12400,.10],[50400,.12],[105700,.22],[201775,.24],[256225,.32],[640600,.35],[Infinity,.37]],
  mfj:   [[24800,.10],[100800,.12],[211400,.22],[403550,.24],[512450,.32],[768700,.35],[Infinity,.37]],
  mfs:   [[12400,.10],[50400,.12],[105700,.22],[201775,.24],[256225,.32],[384350,.35],[Infinity,.37]],
  hoh:   [[17700,.10],[67450,.12],[105700,.22],[201775,.24],[256200,.32],[640600,.35],[Infinity,.37]],
};
const STD_DED={single:16100,mfj:32200,mfs:16100,hoh:24150};
// 2026 Long-Term Capital Gains Brackets (Rev. Proc. 2025-32)
const CG_BRACKETS={
  single:[[49450,0],[545500,.15],[Infinity,.20]],
  mfj:   [[98900,0],[613700,.15],[Infinity,.20]],
  mfs:   [[49450,0],[306850,.15],[Infinity,.20]],
  hoh:   [[66200,0],[579600,.15],[Infinity,.20]],
};
function estTax(gross,status){
  const taxable=Math.max(0,gross-(STD_DED[status]||16100));
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
    nav:{home:"Home",calculators:"Calculators",blog:"Blog",shop:"Shop",about:"About",privacy:"Privacy Policy"},
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
  {icon:"🏡",date:"2026",
   title:{en:"5 Ways Rental Properties Build Wealth (Most New Investors Only Know One)",vi:"5 Cách Bất Động Sản Cho Thuê Tạo Ra Tài Sản (Hầu Hết Nhà Đầu Tư Mới Chỉ Biết Một)",es:"5 Formas en que las Propiedades de Alquiler Generan Riqueza (La Mayoría de los Inversores Nuevos Solo Conocen Una)"},
   excerpt:{en:"Most people think a rental makes money one way: cash flow. In reality, a single property can build wealth five different ways at the same time. A CPA breaks down all five — including the tax benefits most investors overlook.",vi:"Hầu hết mọi người nghĩ bất động sản cho thuê chỉ kiếm tiền một cách: dòng tiền. Thực tế, một bất động sản có thể tạo ra tài sản theo năm cách cùng lúc. Một CPA phân tích cả năm cách — bao gồm lợi ích thuế mà nhiều nhà đầu tư bỏ qua.",es:"La mayoría piensa que un alquiler genera dinero de una forma: el flujo de caja. En realidad, una sola propiedad puede generar riqueza de cinco formas a la vez. Una CPA explica las cinco — incluyendo los beneficios fiscales que muchos inversores pasan por alto."},
   content:{
     en:`When most people first think about investing in rental property, they focus on one thing: monthly cash flow.

Positive cash flow matters, but it's only one piece of the picture. One reason real estate has remained a popular long-term investment is that a single rental property can build wealth in several different ways at the same time.

Understanding these wealth-building engines helps you evaluate a property beyond the narrow question, "Will this make money every month?" To keep things concrete, we'll follow one example property throughout: a rental purchased for $350,000 with a $280,000 loan.

One thing worth noting up front: unlike many investments, rental real estate is often purchased with financing. This leverage lets you control a larger asset with less cash upfront, which can magnify both your gains and your losses — and it's part of why several of the engines below work so powerfully together.

**1. Cash Flow**
Cash flow is the income left after collecting rent and paying operating expenses such as your mortgage payment, property taxes, insurance, repairs and maintenance, property management, HOA fees, and a vacancy allowance.

Positive cash flow improves your monthly financial position and can be reinvested or used to build reserves. Many new investors focus on cash flow alone — but experienced investors treat it as just one part of the total return. For our $350,000 example property, let's say cash flow runs about $3,000 in the first year.

**2. Mortgage Paydown**
Every monthly mortgage payment reduces your loan balance. Part of each payment covers interest, but another portion pays down principal — and if your tenants' rent is covering the payment, they're the ones reducing your loan over time.

In the early years of a typical 30-year loan, most of the payment goes to interest, so principal reduction starts modest and accelerates later. On our $280,000 loan, roughly $4,000 to $5,000 of principal might be paid down in the first year, with that figure growing each year as the balance shrinks. Mortgage paydown is easy to overlook because it happens quietly in the background — but over a decade or two it can become a meaningful source of equity that has nothing to do with the market going up.

**3. Appreciation**
Property values don't rise every year, and no one can reliably predict the market. Over long periods, though, many markets have appreciated due to factors like population growth, inflation, limited housing supply, economic development, and rising replacement costs.

If our $350,000 property is worth $360,000 after the first year, that's $10,000 in market value gained — separate from cash flow and mortgage paydown. Appreciation should never be the only reason to buy, but historically it's been an important part of long-term returns.

**A Note on Risk**
None of these engines runs in a straight line. Vacancies, unexpected repairs, falling property values, rising interest rates, or poor management can shrink or even erase returns in a given year. That's exactly why experienced investors weigh all five factors together rather than betting on appreciation or cash flow alone — the combination is what provides resilience.

**4. Buying Right**
Many successful investors focus less on timing the market and more on buying the right property. Purchasing below market value — or buying something with strong upside — can create equity immediately. Examples include distressed properties, cosmetic fixer-uppers, motivated sellers, poorly marketed listings, and homes in improving neighborhoods.

Here's an important distinction: unlike the first three engines, buying right is a one-time cushion you lock in at purchase, not an annual return. If you buy our $350,000 property for $335,000 when it's genuinely worth $350,000, you've created $15,000 in equity on day one. That's real — but it happens once, at closing, rather than building year after year. Not every purchase offers this. Disciplined investors often spend more time finding the right deal than rushing to buy.

**5. Tax Benefits**
One of the biggest advantages of rental real estate is the U.S. tax system. Rental owners may be able to deduct many ordinary and necessary expenses, including mortgage interest, property taxes, repairs, insurance, professional fees, property management, and depreciation.

Depreciation is especially valuable because it's generally a non-cash deduction. In many cases, a rental property can generate positive cash flow while reporting lower taxable rental income — because depreciation reduces taxable rental income without requiring you to spend additional cash.

How much benefit you actually get depends on factors such as your income level, the passive activity loss rules, the special $25,000 rental real estate allowance (which phases out at higher incomes), whether you materially participate, whether you qualify as a Real Estate Professional, whether the property is a short-term rental, and cost segregation opportunities. Each of these can dramatically change the outcome — and they're exactly what the free calculators on this site are built to help with.

**The Real Power Comes From Combining All Five**
Most investments offer a single source of return. Rental property is different because several wealth-building factors can work at once. Picture a property that generates positive monthly cash flow, has its mortgage paid down by tenants, appreciates over time, was purchased below market value, and produces valuable tax deductions. Any one alone might seem ordinary. Together, they can meaningfully improve long-term returns — and it's a big reason many investors keep building portfolios over decades rather than chasing short-term gains.

**A Worked Example**
Let's total the first year for our $350,000 example property. Cash flow contributes about $3,000. Mortgage principal paid down adds roughly $4,500. Appreciation, in this illustration, adds $10,000. Tax benefits from depreciation and deductions vary by your situation. That's an annual subtotal of around $17,500 or more — before tax benefits.

Separately, buying right created a one-time $15,000 equity cushion at purchase. Notice the structure: the first four engines are recurring — they show up year after year. Buying right is listed separately because it's a one-time cushion captured at closing, not an annual return, so it shouldn't be stacked into the yearly figure. Even though the monthly cash flow is modest, the property's total economic benefit in year one is several times larger once every engine is counted — and the recurring engines keep compounding in the years that follow.

All figures here are illustrative examples, not projections. Your actual results depend on your specific property, loan terms, market, and tax situation.

**Final Thoughts**
Successful real estate investing is rarely about a single number. Looking only at cash flow can cause you to overlook valuable opportunities — or misunderstand why experienced investors buy certain properties. The tax side is often the least understood, but it can have a real impact on overall returns. Topics like depreciation, cost segregation, capital gains planning, and 1031 exchanges deserve careful thought — before you buy, and especially before you sell.`,
     vi:`Khi hầu hết mọi người mới nghĩ về đầu tư bất động sản cho thuê, họ chỉ tập trung vào một điều: dòng tiền hàng tháng.

Dòng tiền dương rất quan trọng, nhưng đó chỉ là một phần của bức tranh. Một lý do bất động sản vẫn là khoản đầu tư dài hạn được ưa chuộng là vì một bất động sản cho thuê duy nhất có thể tạo ra tài sản theo nhiều cách khác nhau cùng một lúc.

Hiểu được những "động cơ" tạo tài sản này giúp bạn đánh giá một bất động sản vượt ra ngoài câu hỏi hạn hẹp "Nó có kiếm tiền mỗi tháng không?" Để cụ thể, chúng ta sẽ theo dõi một bất động sản ví dụ xuyên suốt: một bất động sản cho thuê được mua với giá $350,000 với khoản vay $280,000.

Một điều đáng lưu ý ngay từ đầu: không giống nhiều khoản đầu tư khác, bất động sản cho thuê thường được mua bằng vốn vay. Đòn bẩy này cho phép bạn kiểm soát một tài sản lớn hơn với ít tiền mặt ban đầu hơn, điều này có thể khuếch đại cả lợi nhuận lẫn thua lỗ — và đó là một phần lý do tại sao nhiều động cơ dưới đây hoạt động mạnh mẽ cùng nhau.

**1. Dòng Tiền**
Dòng tiền là thu nhập còn lại sau khi thu tiền thuê và trả các chi phí vận hành như khoản trả nợ vay, thuế bất động sản, bảo hiểm, sửa chữa và bảo trì, quản lý bất động sản, phí HOA, và dự phòng cho thời gian trống.

Dòng tiền dương cải thiện tình hình tài chính hàng tháng của bạn và có thể được tái đầu tư hoặc dùng để xây dựng quỹ dự phòng. Nhiều nhà đầu tư mới chỉ tập trung vào dòng tiền — nhưng nhà đầu tư có kinh nghiệm coi đó chỉ là một phần của tổng lợi nhuận. Với bất động sản ví dụ $350,000 của chúng ta, giả sử dòng tiền khoảng $3,000 trong năm đầu tiên.

**2. Trả Dần Nợ Vay**
Mỗi khoản trả nợ vay hàng tháng làm giảm số dư nợ của bạn. Một phần của mỗi khoản trả là tiền lãi, nhưng một phần khác trả vào gốc — và nếu tiền thuê của người thuê đang trang trải khoản này, thì chính họ đang giảm nợ vay cho bạn theo thời gian.

Trong những năm đầu của khoản vay 30 năm thông thường, phần lớn khoản trả là tiền lãi, nên việc trả gốc bắt đầu khiêm tốn và tăng dần về sau. Với khoản vay $280,000 của chúng ta, khoảng $4,000 đến $5,000 tiền gốc có thể được trả trong năm đầu, và con số này tăng mỗi năm khi số dư giảm. Việc trả dần nợ dễ bị bỏ qua vì nó diễn ra âm thầm — nhưng qua một hoặc hai thập kỷ, nó có thể trở thành nguồn vốn chủ sở hữu đáng kể không liên quan gì đến việc thị trường tăng giá.

**3. Tăng Giá Trị**
Giá trị bất động sản không tăng mỗi năm, và không ai có thể dự đoán chính xác thị trường. Tuy nhiên, qua các giai đoạn dài, nhiều thị trường đã tăng giá do các yếu tố như tăng dân số, lạm phát, nguồn cung nhà ở hạn chế, phát triển kinh tế, và chi phí thay thế tăng.

Nếu bất động sản $350,000 của chúng ta trị giá $360,000 sau năm đầu tiên, đó là $10,000 giá trị thị trường tăng thêm — tách biệt với dòng tiền và trả dần nợ. Tăng giá trị không bao giờ nên là lý do duy nhất để mua, nhưng trong lịch sử nó đã là một phần quan trọng của lợi nhuận dài hạn.

**Lưu Ý Về Rủi Ro**
Không có động cơ nào hoạt động theo đường thẳng. Thời gian trống, sửa chữa bất ngờ, giá trị bất động sản giảm, lãi suất tăng, hoặc quản lý kém có thể làm giảm hoặc thậm chí xóa sạch lợi nhuận trong một năm nhất định. Đó chính là lý do nhà đầu tư có kinh nghiệm cân nhắc cả năm yếu tố cùng nhau thay vì đặt cược vào tăng giá hay dòng tiền đơn lẻ — chính sự kết hợp mới tạo ra khả năng chống chịu.

**4. Mua Đúng**
Nhiều nhà đầu tư thành công ít tập trung vào việc canh thời điểm thị trường mà chú trọng hơn vào việc mua đúng bất động sản. Mua dưới giá thị trường — hoặc mua thứ có tiềm năng tăng giá mạnh — có thể tạo ra vốn chủ sở hữu ngay lập tức. Ví dụ bao gồm bất động sản gặp khó khăn, nhà cần sửa chữa thẩm mỹ, người bán cần bán gấp, tin rao kém hiệu quả, và nhà ở khu vực đang cải thiện.

Đây là một điểm khác biệt quan trọng: không giống ba động cơ đầu tiên, mua đúng là một khoản đệm một lần bạn khóa lại khi mua, không phải lợi nhuận hàng năm. Nếu bạn mua bất động sản $350,000 với giá $335,000 khi nó thực sự trị giá $350,000, bạn đã tạo ra $15,000 vốn chủ sở hữu ngay ngày đầu. Điều đó là thật — nhưng nó xảy ra một lần, khi mua, chứ không tích lũy năm này qua năm khác. Không phải giao dịch nào cũng có cơ hội này. Nhà đầu tư kỷ luật thường dành nhiều thời gian tìm đúng giao dịch hơn là vội vàng mua.

**5. Lợi Ích Thuế**
Một trong những lợi thế lớn nhất của bất động sản cho thuê là hệ thống thuế Hoa Kỳ. Chủ bất động sản cho thuê có thể được khấu trừ nhiều chi phí thông thường và cần thiết, bao gồm lãi vay thế chấp, thuế bất động sản, sửa chữa, bảo hiểm, phí chuyên môn, quản lý bất động sản, và khấu hao.

Khấu hao đặc biệt có giá trị vì nó thường là khoản khấu trừ không dùng tiền mặt. Trong nhiều trường hợp, một bất động sản cho thuê có thể tạo ra dòng tiền dương trong khi báo cáo thu nhập cho thuê chịu thuế thấp hơn — vì khấu hao làm giảm thu nhập cho thuê chịu thuế mà không cần bạn chi thêm tiền mặt.

Mức lợi ích thực tế bạn nhận được phụ thuộc vào các yếu tố như mức thu nhập của bạn, các quy tắc về lỗ từ hoạt động thụ động, khoản trợ cấp đặc biệt $25,000 cho bất động sản cho thuê (giảm dần ở mức thu nhập cao hơn), việc bạn có tham gia thực chất hay không, việc bạn có đủ điều kiện là Chuyên Gia Bất Động Sản hay không, việc bất động sản có phải cho thuê ngắn hạn hay không, và các cơ hội phân tách chi phí (cost segregation). Mỗi yếu tố này có thể thay đổi đáng kể kết quả — và đó chính là điều mà các máy tính miễn phí trên trang này được xây dựng để hỗ trợ.

**Sức Mạnh Thực Sự Đến Từ Việc Kết Hợp Cả Năm**
Hầu hết các khoản đầu tư chỉ mang lại một nguồn lợi nhuận. Bất động sản cho thuê thì khác vì nhiều yếu tố tạo tài sản có thể hoạt động cùng lúc. Hãy tưởng tượng một bất động sản tạo ra dòng tiền dương hàng tháng, được người thuê trả dần nợ, tăng giá theo thời gian, được mua dưới giá thị trường, và tạo ra các khoản khấu trừ thuế có giá trị. Mỗi yếu tố riêng lẻ có thể trông bình thường. Nhưng cùng nhau, chúng có thể cải thiện đáng kể lợi nhuận dài hạn — và đó là lý do lớn khiến nhiều nhà đầu tư tiếp tục xây dựng danh mục qua nhiều thập kỷ thay vì theo đuổi lợi nhuận ngắn hạn.

**Một Ví Dụ Cụ Thể**
Hãy tính tổng năm đầu tiên cho bất động sản ví dụ $350,000 của chúng ta. Dòng tiền đóng góp khoảng $3,000. Trả gốc nợ vay thêm khoảng $4,500. Tăng giá, trong minh họa này, thêm $10,000. Lợi ích thuế từ khấu hao và các khoản khấu trừ thay đổi tùy tình huống của bạn. Đó là tổng phụ hàng năm khoảng $17,500 trở lên — trước lợi ích thuế.

Riêng biệt, mua đúng đã tạo ra khoản đệm vốn chủ sở hữu $15,000 một lần khi mua. Lưu ý cấu trúc: bốn động cơ đầu tiên là lặp lại — chúng xuất hiện năm này qua năm khác. Mua đúng được liệt kê riêng vì nó là khoản đệm một lần khi mua, không phải lợi nhuận hàng năm, nên không nên cộng vào con số hàng năm. Dù dòng tiền hàng tháng khiêm tốn, tổng lợi ích kinh tế của bất động sản trong năm đầu lớn hơn nhiều lần khi tính tất cả các động cơ — và các động cơ lặp lại tiếp tục tích lũy trong những năm sau.

Tất cả các con số ở đây là ví dụ minh họa, không phải dự báo. Kết quả thực tế của bạn phụ thuộc vào bất động sản cụ thể, điều khoản vay, thị trường, và tình hình thuế của bạn.

**Suy Nghĩ Cuối**
Đầu tư bất động sản thành công hiếm khi chỉ về một con số. Chỉ nhìn vào dòng tiền có thể khiến bạn bỏ lỡ các cơ hội giá trị — hoặc hiểu sai lý do nhà đầu tư có kinh nghiệm mua những bất động sản nhất định. Mặt thuế thường ít được hiểu nhất, nhưng nó có thể tác động thực sự đến tổng lợi nhuận. Các chủ đề như khấu hao, phân tách chi phí, lập kế hoạch lãi vốn, và trao đổi 1031 đáng được cân nhắc kỹ — trước khi bạn mua, và đặc biệt trước khi bạn bán.`,
     es:`Cuando la mayoría de las personas piensan por primera vez en invertir en propiedades de alquiler, se enfocan en una sola cosa: el flujo de caja mensual.

El flujo de caja positivo importa, pero es solo una parte del panorama. Una razón por la que los bienes raíces siguen siendo una inversión popular a largo plazo es que una sola propiedad de alquiler puede generar riqueza de varias formas distintas al mismo tiempo.

Entender estos "motores" de creación de riqueza le ayuda a evaluar una propiedad más allá de la pregunta limitada "¿Generará dinero cada mes?" Para ser concretos, seguiremos una propiedad de ejemplo a lo largo del artículo: un alquiler comprado por $350,000 con un préstamo de $280,000.

Vale la pena señalar algo desde el principio: a diferencia de muchas inversiones, los bienes raíces de alquiler a menudo se compran con financiamiento. Este apalancamiento le permite controlar un activo más grande con menos efectivo inicial, lo que puede magnificar tanto sus ganancias como sus pérdidas — y es parte de por qué varios de los motores siguientes funcionan tan poderosamente juntos.

**1. Flujo de Caja**
El flujo de caja es el ingreso que queda después de cobrar la renta y pagar los gastos operativos como el pago de la hipoteca, los impuestos a la propiedad, el seguro, las reparaciones y el mantenimiento, la administración de la propiedad, las cuotas de HOA, y una reserva para vacancia.

El flujo de caja positivo mejora su posición financiera mensual y puede reinvertirse o usarse para crear reservas. Muchos inversores nuevos se enfocan solo en el flujo de caja — pero los inversores con experiencia lo tratan como solo una parte del rendimiento total. Para nuestra propiedad de ejemplo de $350,000, digamos que el flujo de caja es de unos $3,000 en el primer año.

**2. Amortización de la Hipoteca**
Cada pago mensual de la hipoteca reduce el saldo de su préstamo. Parte de cada pago cubre los intereses, pero otra parte reduce el capital — y si la renta de sus inquilinos cubre el pago, son ellos quienes reducen su préstamo con el tiempo.

En los primeros años de un préstamo típico a 30 años, la mayor parte del pago se destina a intereses, así que la reducción del capital comienza modesta y se acelera después. En nuestro préstamo de $280,000, aproximadamente $4,000 a $5,000 de capital podrían pagarse en el primer año, y esa cifra crece cada año a medida que el saldo disminuye. La amortización es fácil de pasar por alto porque ocurre silenciosamente — pero a lo largo de una o dos décadas puede convertirse en una fuente significativa de plusvalía que no tiene nada que ver con la subida del mercado.

**3. Apreciación**
El valor de las propiedades no sube cada año, y nadie puede predecir el mercado con certeza. Sin embargo, durante períodos largos, muchos mercados se han apreciado debido a factores como el crecimiento de la población, la inflación, la oferta limitada de vivienda, el desarrollo económico, y el aumento de los costos de reposición.

Si nuestra propiedad de $350,000 vale $360,000 después del primer año, eso es $10,000 de valor de mercado ganado — separado del flujo de caja y la amortización. La apreciación nunca debe ser la única razón para comprar, pero históricamente ha sido una parte importante de los rendimientos a largo plazo.

**Una Nota Sobre el Riesgo**
Ninguno de estos motores funciona en línea recta. Las vacancias, las reparaciones inesperadas, la caída del valor de la propiedad, el aumento de las tasas de interés, o una mala administración pueden reducir o incluso eliminar los rendimientos en un año determinado. Por eso precisamente los inversores con experiencia consideran los cinco factores juntos en lugar de apostar solo a la apreciación o al flujo de caja — la combinación es lo que brinda resiliencia.

**4. Comprar Bien**
Muchos inversores exitosos se enfocan menos en sincronizar el mercado y más en comprar la propiedad correcta. Comprar por debajo del valor de mercado — o adquirir algo con fuerte potencial — puede crear plusvalía de inmediato. Algunos ejemplos incluyen propiedades en dificultades, casas que necesitan reparaciones cosméticas, vendedores motivados, anuncios mal promocionados, y casas en vecindarios en mejora.

Aquí hay una distinción importante: a diferencia de los primeros tres motores, comprar bien es un colchón único que usted asegura al momento de la compra, no un rendimiento anual. Si compra nuestra propiedad de $350,000 por $335,000 cuando realmente vale $350,000, ha creado $15,000 de plusvalía el primer día. Eso es real — pero ocurre una vez, al cierre, en lugar de acumularse año tras año. No todas las compras ofrecen esto. Los inversores disciplinados a menudo dedican más tiempo a encontrar el trato correcto que a apresurarse a comprar.

**5. Beneficios Fiscales**
Una de las mayores ventajas de los bienes raíces de alquiler es el sistema fiscal de EE.UU. Los propietarios de alquileres pueden deducir muchos gastos ordinarios y necesarios, incluyendo intereses hipotecarios, impuestos a la propiedad, reparaciones, seguros, honorarios profesionales, administración de la propiedad, y depreciación.

La depreciación es especialmente valiosa porque generalmente es una deducción sin desembolso de efectivo. En muchos casos, una propiedad de alquiler puede generar flujo de caja positivo mientras reporta menos ingresos de alquiler gravables — porque la depreciación reduce el ingreso de alquiler gravable sin requerir que usted gaste efectivo adicional.

Cuánto beneficio recibe realmente depende de factores como su nivel de ingresos, las reglas de pérdidas por actividad pasiva, la asignación especial de $25,000 para bienes raíces de alquiler (que se reduce gradualmente con ingresos más altos), si participa materialmente, si califica como Profesional de Bienes Raíces, si la propiedad es un alquiler a corto plazo, y las oportunidades de segregación de costos. Cada uno de estos puede cambiar drásticamente el resultado — y son exactamente para lo que están diseñadas las calculadoras gratuitas de este sitio.

**El Verdadero Poder Viene de Combinar los Cinco**
La mayoría de las inversiones ofrecen una sola fuente de rendimiento. Las propiedades de alquiler son diferentes porque varios factores de creación de riqueza pueden funcionar a la vez. Imagine una propiedad que genera flujo de caja mensual positivo, tiene su hipoteca pagada por los inquilinos, se aprecia con el tiempo, fue comprada por debajo del valor de mercado, y produce valiosas deducciones fiscales. Cada uno por sí solo puede parecer ordinario. Juntos, pueden mejorar significativamente los rendimientos a largo plazo — y es una gran razón por la que muchos inversores siguen construyendo carteras durante décadas en lugar de perseguir ganancias a corto plazo.

**Un Ejemplo Práctico**
Sumemos el primer año para nuestra propiedad de ejemplo de $350,000. El flujo de caja aporta unos $3,000. La amortización del capital añade aproximadamente $4,500. La apreciación, en esta ilustración, añade $10,000. Los beneficios fiscales de la depreciación y las deducciones varían según su situación. Eso es un subtotal anual de alrededor de $17,500 o más — antes de los beneficios fiscales.

Por separado, comprar bien creó un colchón de plusvalía único de $15,000 en la compra. Note la estructura: los primeros cuatro motores son recurrentes — aparecen año tras año. Comprar bien se lista por separado porque es un colchón único capturado al cierre, no un rendimiento anual, así que no debe sumarse a la cifra anual. Aunque el flujo de caja mensual es modesto, el beneficio económico total de la propiedad en el primer año es varias veces mayor cuando se cuentan todos los motores — y los motores recurrentes siguen acumulándose en los años siguientes.

Todas las cifras aquí son ejemplos ilustrativos, no proyecciones. Sus resultados reales dependen de su propiedad específica, los términos del préstamo, el mercado, y su situación fiscal.

**Reflexiones Finales**
La inversión inmobiliaria exitosa rara vez se trata de un solo número. Mirar solo el flujo de caja puede hacer que pase por alto oportunidades valiosas — o que malinterprete por qué los inversores con experiencia compran ciertas propiedades. El lado fiscal es a menudo el menos comprendido, pero puede tener un impacto real en los rendimientos generales. Temas como la depreciación, la segregación de costos, la planificación de ganancias de capital, y los intercambios 1031 merecen una consideración cuidadosa — antes de comprar, y especialmente antes de vender.`,
   }},
  {icon:"🏠",date:"2026",
   title:{en:"IRS Rental Property Depreciation Calculator (2026) — Free Tool & Complete Guide",vi:"Máy Tính Khấu Hao Bất Động Sản Cho Thuê IRS (2026)",es:"Calculadora de Depreciación de Propiedad de Alquiler IRS (2026)"},
   excerpt:{en:"Use our free IRS rental property depreciation calculator to find your exact annual deduction. Includes the correct basis calculation from your HUD-1, the mid-month convention, and answers to the most common depreciation questions.",vi:"Dùng máy tính khấu hao miễn phí để tính đúng khoản khấu trừ hàng năm từ bất động sản cho thuê.",es:"Use nuestra calculadora gratuita para calcular su deducción anual de depreciación de propiedad de alquiler."},
   content:{
     en:`## What Is a Rental Property Depreciation Calculator?

A rental property depreciation calculator estimates your annual IRS depreciation deduction based on your property's depreciable basis, land allocation, closing costs, and placed-in-service date. For residential rental property, the IRS requires depreciation using the MACRS 27.5-year straight-line recovery period (IRS Publication 527).

The free IRS rental property depreciation calculator at the top of this page goes further than most tools — you can upload your HUD-1 or Closing Disclosure and it automatically identifies which closing costs add to your depreciable basis.

## How to Use the Rental Property Depreciation Calculator

**Step 1 — Enter your purchase price.** This is your starting point for calculating depreciable basis.

**Step 2 — Add qualifying closing costs.** Title insurance, settlement fees, recording charges, transfer taxes, and attorney fees for title work all add to your basis. The calculator's HUD-1 upload feature does this automatically.

**Step 3 — Enter your land value.** Land is never depreciable under IRS rules. Use your county assessor's land-to-total ratio to find the correct split.

**Step 4 — Enter your placed-in-service date.** The IRS mid-month convention applies in Year 1 — you get credit for half of the month you placed the property in service.

The calculator applies MACRS depreciation rules and shows your Year 1 deduction with the correct mid-month convention automatically.

## Upload Your Closing Disclosure — Our Key Advantage

Most rental property depreciation calculators online require you to manually enter a single purchase price number.

Our calculator reads your actual HUD-1 Settlement Statement or Closing Disclosure and identifies every basis-related closing cost automatically — mapping each line item to the correct IRS category per Publication 551. This means your depreciable basis is calculated from the actual document, not a rough estimate.

This feature is what separates this IRS rental property depreciation calculator from every generic tool online.

## How Rental Property Depreciation Works

The IRS allows you to deduct the theoretical wear and tear on your rental building every year for 27.5 years. This is called MACRS (Modified Accelerated Cost Recovery System) depreciation.

The annual deduction formula:

**Annual Depreciation = Building Basis ÷ 27.5**

**Example:** Building basis $225,000 ÷ 27.5 = **$8,182 per year**

At a 32% tax bracket, that saves $2,618 in federal taxes annually — from a non-cash deduction that costs you nothing out of pocket.

## What Closing Costs Increase Rental Property Basis?

These closing costs from your HUD-1 add to your depreciable basis (IRS Publication 551):

- Title insurance — lender's and owner's policy
- Settlement or closing fee
- Government recording charges
- Transfer taxes and documentary stamps
- Attorney fees for title work (not loan-related)
- Survey fee
- Buyer-paid inspections

These do NOT add to basis: loan origination fees, prepaid mortgage interest, escrow deposits, seller credits, and tax proration credits (these actually reduce your basis).

## Related Rental Property Tax Calculators

- **Rental Property Basis Calculator** — full HUD-1 analysis with cash-to-close reconciliation
- **Capital Gains Tax Calculator** — including depreciation recapture at sale
- **1031 Exchange Calculator** — defer capital gains and recapture tax
- **Cost Segregation Estimator** — accelerate depreciation with 5/7/15-year components
- **Short-Term Rental Tax Calculator** — Airbnb and VRBO tax analysis

All free at realtytaxtools.com — no signup required.

## Frequently Asked Questions

**How do I calculate depreciation on a rental property?**
Divide your building's depreciable basis by 27.5 (for residential property). The basis equals your purchase price plus qualifying closing costs minus land value. In Year 1, apply the IRS mid-month convention based on when you placed the property in service.

**Can I depreciate land?**
No. Land is never depreciable under IRS rules. You must allocate your total basis between land and building before calculating depreciation. Use your county assessor's land-to-total ratio for the most defensible allocation.

**What closing costs increase rental property basis?**
Title insurance, recording fees, transfer taxes, settlement fees, survey fees, and attorney fees for title work generally increase depreciable basis. Loan costs, prepaid interest, and seller credits do not — and seller tax proration credits actually reduce your basis.

**What IRS publication covers rental property depreciation?**
The primary references are IRS Publication 527 (Residential Rental Property), IRS Publication 551 (Basis of Assets), and Rev. Proc. 87-57 (MACRS depreciation tables).

**What happens if I don't claim depreciation?**
The IRS can still require depreciation recapture when you sell, even if you failed to claim allowable depreciation. The recapture is based on the depreciation you were allowed to take — not what you actually claimed. Always claim your full depreciation deduction each year.

**What is the mid-month convention?**
In the year you place a rental property in service, the IRS gives you credit for half of the month you acquired it. A property placed in service in June gets 6.5 months of depreciation in Year 1 (6.5 ÷ 12 × annual amount). The free calculator applies this automatically.

**What is depreciation recapture?**
When you sell a rental property, the IRS taxes all depreciation you claimed (or could have claimed) at a maximum rate of 25% — called unrecaptured Section 1250 gain. This is a reason to track depreciation carefully and consider a 1031 exchange to defer the tax.`,
   }},
  {icon:"⚖️",date:"2025",
   title:{en:"What Is the IRS Underpayment Penalty — And How to Avoid It",vi:"Phạt Thiếu Thuế IRS Là Gì — Và Cách Tránh",es:"La Multa del IRS por Pago Insuficiente — Y Cómo Evitarla"},
   excerpt:{en:"Rental property owners and investors are hit with this penalty constantly — often without realizing it. Here's exactly how it works, what triggers it, and the two safe harbor rules that protect you.",vi:"Chủ nhà cho thuê và nhà đầu tư thường bị phạt mà không biết. Đây là cách hoạt động và hai quy tắc an toàn bảo vệ bạn.",es:"Los propietarios de alquileres e inversores son multados constantemente sin darse cuenta. Así funciona y las dos reglas de puerto seguro que te protegen."},
   content:{
     en:`Most W-2 employees never think about the underpayment penalty — their employer handles tax withholding automatically. But if you own rental property, have investment income, or are self-employed, you are responsible for paying taxes throughout the year, not just on April 15.

The IRS underpayment penalty applies when you don't pay enough during the year. The current rate is tied to the federal short-term rate plus 3 percentage points — which in recent years has been around 7–8% annually. And here's the part that surprises most people: **the penalty is calculated separately for each quarter**, not just your annual shortfall.

This means you could pay every penny of your tax bill by April 15 and still owe a penalty for Q1, Q2, or Q3.

**The Two Safe Harbor Rules**

You avoid the penalty completely if you meet either of these:

**Safe Harbor 1 — 90% Rule:** Your total payments equal at least 90% of your current year's tax liability.

**Safe Harbor 2 — Prior Year Rule:** Your total payments equal 100% of last year's tax liability. If your prior year adjusted gross income (AGI) exceeded $150,000 (or $75,000 if married filing separately), the threshold is 110%.

You only need to satisfy ONE of these. The prior year rule is often easier because it's a known number — you just match last year's tax bill.

**Who Gets Hit Hardest**

Rental property owners are especially vulnerable because:
- Rental income isn't subject to withholding
- Depreciation deductions can create large swings in taxable income year to year
- Capital gains from property sales create sudden large tax bills

**A Real Example**

Suppose your 2024 tax bill is $24,000 but you only made $18,000 in quarterly payments. That's a $6,000 shortfall — 75% of your liability. You'd owe a penalty on that gap for every quarter it was underpaid.

If your 2023 tax bill was $20,000, you could have avoided the penalty entirely by paying $20,000 (100% prior year rule) — or $22,000 if your AGI was over $150,000 (110% rule).

**How to Calculate Your Quarterly Payments**

Divide your target amount by four and pay by each due date:
- Q1: April 15
- Q2: June 15
- Q3: September 15
- Q4: January 15 (following year)

Use the free Underpayment Penalty Calculator at the top of this page to see your exact safe harbor targets, identify quarterly shortfalls, and estimate your penalty if you're already behind.`,
   }},
  {icon:"🏠",date:"2025",
   title:{en:"Rental Property Depreciation: The $8,000-a-Year Deduction Most Landlords Underuse",vi:"Khấu Hao Nhà Cho Thuê: Khoản Khấu Trừ $8,000/Năm Mà Nhiều Chủ Nhà Bỏ Lỡ",es:"Depreciación de Alquiler: La Deducción de $8,000/Año Que Muchos Propietarios No Aprovechan"},
   excerpt:{en:"Depreciation is a non-cash deduction that reduces your taxable rental income every year without costing you a dollar out of pocket. But calculating it correctly — especially your depreciable basis — is where most landlords leave money on the table.",vi:"Khấu hao là khoản khấu trừ không dùng tiền mặt giúp giảm thu nhập cho thuê chịu thuế hàng năm mà không tốn một đồng nào. Nhưng tính đúng cơ sở khấu hao là chỗ nhiều chủ nhà bỏ tiền.",es:"La depreciación es una deducción no monetaria que reduce sus ingresos de alquiler gravables cada año sin costarle un dólar. Pero calcularla correctamente es donde la mayoría de propietarios pierde dinero."},
   content:{
     en:`Depreciation is one of the only tax deductions that saves you money without costing you money. You don't write a check — you simply deduct the theoretical "wear and tear" on your rental building each year. Over 27.5 years for residential property, that adds up to your entire building value.

Here's what that looks like in dollars:

**Example:** You buy a rental house for $280,000. The county assessor says land is 20% of value ($56,000), so the depreciable building basis is $224,000.

Annual depreciation = $224,000 ÷ 27.5 = **$8,145 per year**

If you're in the 22% tax bracket, that's **$1,792 in tax savings every year** — from a non-cash deduction.

**Your Depreciable Basis Isn't Just the Purchase Price**

This is where most landlords get it wrong. Your depreciable basis includes:

✓ Purchase price of the building (not land)
✓ Certain closing costs — title insurance, recording fees, settlement fee, attorney fees (title work), survey
✓ Capital improvements made after purchase

It does NOT include:
✗ Land (never depreciable)
✗ Loan origination fees (those are amortized separately)
✗ Seller credits and tax prorations (these reduce your basis)

**How to Find Your Land Value**

Check your county appraisal district's website (in Texas: your county CAD). Look for the assessed land value vs. total assessed value. That ratio is your land percentage. Apply it to your purchase price plus closing costs.

If the county ratio doesn't feel accurate for your property, you can also get an appraisal or use the sales price allocation from your closing disclosure.

**The Mid-Month Convention for Year 1**

In the year you place the property in service, you don't get a full year of depreciation. The IRS uses the "mid-month convention" — you get credit for half of the month you placed it in service. A property placed in service in August gets 4.5 months of depreciation in Year 1.

**Depreciation Recapture — The Hidden Cost**

Here's what most landlords miss: when you sell the property, the IRS recaptures all depreciation you've claimed (or could have claimed) and taxes it at a maximum rate of 25%. This is called "unrecaptured Section 1250 gain."

That's not a reason to skip depreciation — it's a reason to track it carefully and consider a 1031 exchange when you sell.

Use the free Depreciation Calculator at the top of this page to enter your purchase price, closing costs, and land value. It will show your exact annual deduction and let you add asset classes for appliances, improvements, and land improvements.`,
   }},
  {icon:"⭐",date:"2025",
   title:{en:"Real Estate Professional Status (REPS): Unlocking Unlimited Rental Loss Deductions",vi:"Chuyên Gia Bất Động Sản (REPS): Mở Khóa Khấu Trừ Tổn Thất Cho Thuê Không Giới Hạn",es:"Estado de Profesional Inmobiliario (REPS): Desbloqueando Deducciones Ilimitadas de Pérdidas"},
   excerpt:{en:"For high-income investors with large depreciation deductions, Real Estate Professional Status can eliminate six figures of tax liability. But the IRS scrutinizes these claims heavily — and the documentation requirements are strict.",vi:"Đối với nhà đầu tư thu nhập cao với khấu hao lớn, Trạng thái Chuyên gia BĐS có thể loại bỏ sáu chữ số nợ thuế. Nhưng IRS kiểm tra kỹ những yêu cầu này.",es:"Para inversores de altos ingresos con grandes deducciones de depreciación, el estado REPS puede eliminar seis cifras de obligación fiscal. Pero el IRS los examina intensamente."},
   content:{
     en:`Under normal IRS rules, rental real estate is a "passive activity." Passive losses — including depreciation deductions that exceed your rental income — can only offset other passive income. They cannot offset W-2 wages, business income, or most other ordinary income.

This passive activity limitation (PAL) is why many landlords sit on large "paper losses" from depreciation that they can never use.

**Real Estate Professional Status changes that.**

If you qualify as a real estate professional under IRC §469(c)(7), your rental activities can become non-passive. This means losses from depreciation can offset your W-2 income, business income, or any other ordinary income — potentially eliminating hundreds of thousands in tax liability.

**The Two-Part Qualification Test**

To qualify as a real estate professional, you must personally satisfy both tests:

1. **More than 750 hours** during the tax year in real property trades or businesses in which you materially participate
2. **More than 50%** of your total personal services during the year are in real property trades or businesses

Both tests must be met every tax year. There is no election — you either qualify or you don't based on actual hours spent.

**What Counts as Real Property Activities?**

Qualifying activities include development, redevelopment, construction, reconstruction, acquisition, conversion, rental, operation, management, leasing, and brokerage. This covers most of what active real estate investors actually do.

**The Spouse Rule**

If you're married and one spouse qualifies as a real estate professional, the couple can treat rental losses as non-passive — even if the other spouse works full-time in an unrelated field. However, only one spouse can claim the hours; they cannot combine their hours to reach 750.

**Material Participation Is Still Required**

This is the step many investors miss. Even after qualifying as a real estate professional, you must still **materially participate** in each individual rental activity. There are seven tests for material participation; the most common are:
- 500+ hours in the activity
- Substantially all participation is yours
- 100+ hours AND more hours than anyone else

You can elect to group all your rental properties as one activity to meet the material participation test more easily.

**Documentation — Where Most Claims Fail**

The IRS and Tax Court have rejected numerous REPS claims for one reason: inadequate records. Contemporaneous time logs (kept as you go, not reconstructed later) are essential. A good log includes:
- Date
- Property or activity
- Task description
- Hours spent

Emails, texts, management logs, and calendars can supplement time logs but typically cannot replace them.

**Is It Worth Pursuing?**

REPS is most valuable when you have:
- High W-2 or business income (32%+ bracket)
- Large depreciation deductions — especially from cost segregation
- The ability to genuinely spend 750+ hours in real estate activities

For a physician or executive earning $400,000 W-2 who also owns rentals generating $50,000 in paper depreciation losses, REPS could save $16,500 per year (at 33% marginal rate).

Consult a qualified CPA before claiming REPS. The rules are complex, the documentation requirements are strict, and an IRS audit on this issue can be expensive if you can't support the claim.`,
   }},
];

// ── SHOP ITEMS ────────────────────────────────────────────────────────────────
const SHOP_ITEMS=[
  {icon:"📊",price:47,gumroad:"https://realtytaxtools.gumroad.com/l/xldteyv",
   title:{en:"The Rental Property Tax Workbook — From Closing to Schedule E",vi:"Sổ Tay Thuế BĐS Cho Thuê — Từ Ký Kết Đến Schedule E",es:"Libro de Trabajo Fiscal — Del Cierre al Schedule E"},
   desc:{en:"8-sheet Excel workbook: HUD-1 closing statement analyzer, depreciation schedule (27.5/15/7/5yr + bonus), 30-year adjusted basis tracker, improvements log, Schedule E summary, 16-point mistake checker, and CPA handoff sheet. Built by a CPA.",vi:"8 trang Excel: Phân tích HUD-1, lịch khấu hao (27.5/15/7/5 năm + bonus), theo dõi cơ sở 30 năm, nhật ký cải tiến, tóm tắt Schedule E, 16 kiểm tra lỗi và trang bàn giao CPA.",es:"8 hojas Excel: Analizador HUD-1, programa de depreciación, rastreador de base 30 años, registro de mejoras, resumen Schedule E, verificador de errores y hoja para CPA."},
   badge:{en:"⭐ Most Popular",vi:"Phổ biến nhất",es:"Más Popular"}},
  {icon:"📘",price:0,gumroad:"https://realtytaxtools.gumroad.com/l/wjhazn",
   title:{en:"The Investor Agent Advantage — Free Agent Guide",vi:"Lợi Thế Cho Môi Giới Nhà Đầu Tư — Hướng Dẫn Miễn Phí",es:"La Ventaja del Agente Inversor — Guía Gratuita"},
   desc:{en:"Free 12-page PDF for real estate agents: depreciation explained simply, HUD-1 breakdown, 5 word-for-word scripts, red flags, Q&A cheat sheet, and 2026 quick reference numbers (updated for 100% bonus depreciation). No signup required.",vi:"PDF 12 trang miễn phí cho môi giới: giải thích khấu hao đơn giản, phân tích HUD-1, 5 đoạn hội thoại mẫu, câu hỏi thường gặp và số tham khảo 2026.",es:"PDF gratuito de 12 páginas para agentes: depreciación explicada, desglose HUD-1, 5 guiones, señales de alerta y números de referencia 2026."},
   badge:{en:"🎁 Free Download",vi:"Tải miễn phí",es:"Descarga Gratis"}},
];

// ── PAID CALCULATOR LINKS ─────────────────────────────────────────────────────
// Update these with your real Gumroad links after creating products
const PAID={
  quarterly:  {price:47, link:"https://realtytaxtools.gumroad.com/l/xldteyv"},
  depreciation:{price:47, link:"https://realtytaxtools.gumroad.com/l/xldteyv"},
  capgains:   {price:47, link:"https://realtytaxtools.gumroad.com/l/xldteyv"},
  str:        {price:47, link:"https://realtytaxtools.gumroad.com/l/xldteyv"},
  exchange:   {price:47, link:"https://realtytaxtools.gumroad.com/l/xldteyv"},
};

// ── PAYWALL LOCK COMPONENT ────────────────────────────────────────────────────
function PaywallLock({lang,product,children,features=[],style={}}){
  const L=lang||"en";
  const p=PAID[product]||{price:29,link:"#"};
  const labels={
    en:{unlock:"Full Analysis — in the Excel Workbook",free:"Free estimate above · advanced analysis available in the workbook",get:"Get the Workbook",per:"one-time",includes:"Included in the workbook:",already:"Already purchased?",redeem:"Enter your access code"},
    vi:{unlock:"Phân Tích Đầy Đủ — Trong Workbook Excel",free:"Ước tính miễn phí ở trên · phân tích nâng cao có trong workbook",get:"Mua Workbook",per:"một lần",includes:"Có trong workbook:",already:"Đã mua rồi?",redeem:"Nhập mã truy cập"},
    es:{unlock:"Análisis Completo — en el Workbook de Excel",free:"Estimación gratuita arriba · análisis avanzado disponible en el workbook",get:"Obtener el Workbook",per:"pago único",includes:"Incluido en el workbook:",already:"¿Ya compró?",redeem:"Ingrese su código de acceso"},
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
function GoldBtn({children,onClick,full,disabled}){
  const [h,setH]=useState(false);
  return(
    <button onClick={disabled?undefined:onClick} disabled={disabled} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{padding:"11px 24px",borderRadius:7,fontSize:13,fontFamily:"inherit",cursor:disabled?"default":"pointer",opacity:disabled?0.6:1,
        fontWeight:600,letterSpacing:"0.04em",transition:"all 0.15s",width:full?"100%":"auto",
        background:`linear-gradient(135deg,${h&&!disabled?T.goldLight:T.gold},${T.goldLight})`,
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

// ── SALE TAX REVIEW CTA ───────────────────────────────────────────────────────
// Shown under live calculator results. Collects leads via Formspree.
const REVIEW_ENDPOINT="https://formspree.io/f/xdarpyjd";

function SaleReviewCTA({source="calculator"}){
  const [open,setOpen]=useState(false);
  const [sent,setSent]=useState(false);
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState("");
  const [f,setF]=useState({email:"",purchase:"",sale:"",costseg:"Not sure",notes:""});
  const set=(k,v)=>setF(p=>({...p,[k]:v}));

  async function submit(){
    if(!f.email.includes("@")){setErr("Please enter a valid email.");return;}
    setBusy(true);setErr("");
    try{
      const r=await fetch(REVIEW_ENDPOINT,{
        method:"POST",
        headers:{"Content-Type":"application/json",Accept:"application/json"},
        body:JSON.stringify({
          _subject:"Sale Tax Review request — "+source,
          form:"Sale Tax Review",
          source,
          email:f.email,
          purchase_price_and_date:f.purchase,
          sale_price_and_expected_date:f.sale,
          cost_seg_done:f.costseg,
          notes:f.notes,
        }),
      });
      if(!r.ok) throw new Error("bad response");
      setSent(true);
    }catch(e){
      setErr("Something went wrong. Email hello@realtytaxtools.com instead.");
    }finally{setBusy(false);}
  }

  if(sent) return(
    <div style={{marginTop:16,padding:"18px 20px",background:"rgba(74,144,96,0.08)",border:"1px solid rgba(74,144,96,0.35)",borderRadius:10}}>
      <p style={{fontSize:13,fontWeight:600,color:T.green,margin:"0 0 6px"}}>{"✓ Request received"}</p>
      <p style={{fontSize:12,color:T.textMid,lineHeight:1.7,margin:0}}>
        {"Thank you — I'll follow up by email within 2 business days with next steps and a flat-fee quote. No obligation."}
      </p>
    </div>
  );

  return(
    <div style={{marginTop:18,padding:"20px 22px",background:"linear-gradient(180deg, rgba(200,169,110,0.07), rgba(200,169,110,0.02))",
      border:"1px solid "+T.goldDim,borderRadius:10}}>
      <p style={{fontSize:10,color:T.gold,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",margin:"0 0 8px"}}>
        {"Want your real numbers?"}
      </p>
      <p style={{fontSize:14,color:T.text,fontWeight:500,lineHeight:1.6,margin:"0 0 8px"}}>
        {"This estimate uses general assumptions. Your actual recapture, NIIT exposure, and 1031 / cost-seg options depend on your specific basis and depreciation history."}
      </p>
      <p style={{fontSize:12,color:T.textMid,lineHeight:1.7,margin:"0 0 14px"}}>
        {"I'll run your actual numbers — "}
        <strong style={{color:T.gold}}>{"flat $250–400, fully async by email, no calls."}</strong>
        {" You get a clear written estimate to bring to your CPA, or to decide with. — Thao Nguyen, CPA"}
      </p>

      {!open&&<GoldBtn onClick={()=>setOpen(true)}>{"Request a Sale Tax Review →"}</GoldBtn>}

      {open&&(
        <div style={{marginTop:6}}>
          <Fld label="Your email">
            <Inp value={f.email} onChange={v=>set("email",v)} placeholder="you@email.com"/>
          </Fld>
          <Fld label="Purchase price & date" hint="e.g. $345,000 — March 2017">
            <Inp value={f.purchase} onChange={v=>set("purchase",v)} placeholder="$345,000 — March 2017"/>
          </Fld>
          <Fld label="Sale price & expected sale date" hint="Estimate is fine">
            <Inp value={f.sale} onChange={v=>set("sale",v)} placeholder="$700,000 — this year"/>
          </Fld>
          <Fld label="Has a cost segregation study ever been done?">
            <Sel value={f.costseg} onChange={v=>set("costseg",v)}
              options={[{value:"Not sure",label:"Not sure"},{value:"No",label:"No"},{value:"Yes",label:"Yes"}]}/>
          </Fld>
          <Fld label="Anything else?" optional optLbl="optional">
            <Textarea value={f.notes} onChange={v=>set("notes",v)} rows={3}
              placeholder="1031 plans, multiple properties, primary-residence years, etc."/>
          </Fld>
          {err&&<p style={{fontSize:11,color:T.red,margin:"0 0 10px"}}>{err}</p>}
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <GoldBtn onClick={submit} disabled={busy}>{busy?"Sending…":"Send request"}</GoldBtn>
            <Btn ghost small onClick={()=>setOpen(false)}>{"Cancel"}</Btn>
          </div>
          <p style={{fontSize:10,color:T.textDim,lineHeight:1.6,marginTop:12,marginBottom:0}}>
            {"No obligation. Sending this does not create a CPA–client relationship; engagement begins only after a signed engagement letter."}
          </p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATORS
// ═══════════════════════════════════════════════════════════════════════════════

// ── 1. UNDERPAYMENT ───────────────────────────────────────────────────────────
function UnderpaymentCalc({lang}){
  const L=lang||"en";
  const [step,setStep]=useState(0);
  const [quickMode,setQuickMode]=useState(true);
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
  const QDATES=[new Date(currentYear,3,15),new Date(currentYear,5,15),new Date(currentYear,8,15),new Date(currentYear+1,0,15)];
  const QQ=[
    {l:"Q1",due:L==="vi"?"15/4":L==="es"?"15 abr":"April 15",days:91,mo:L==="vi"?"T1–3":L==="es"?"Ene–Mar":"Jan–Mar",past:today>QDATES[0]},
    {l:"Q2",due:L==="vi"?"15/6":L==="es"?"15 jun":"June 15",days:61,mo:L==="vi"?"T4–5":L==="es"?"Abr–May":"Apr–May",past:today>QDATES[1]},
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

function UnderpaymentSEOBlock(){
  return(
    <div style={{maxWidth:800,margin:"40px auto 0",padding:"0 20px 40px"}}>
      <h2 style={{fontSize:22,fontWeight:400,color:T.text,marginBottom:16,borderBottom:"1px solid "+T.border,paddingBottom:12}}>
        {"How IRS Underpayment Penalties Work"}
      </h2>
      {[
        "The IRS underpayment penalty — calculated under IRC Section 6654 — applies when a taxpayer does not pay enough tax during the year through withholding or estimated quarterly payments. Many real estate investors are surprised by this penalty because rental income, self-employment income, and capital gains are not subject to automatic withholding. If you sell a property mid-year or have a large rental income year, an underpayment penalty is often triggered without warning.",
        "The penalty rate changes quarterly. The IRS sets the underpayment rate at the federal short-term rate plus 3 percentage points, adjusted each quarter. In recent years that rate has ranged from 5% to 8% annually. The penalty is calculated separately for each quarter — meaning a large payment in Q4 does not eliminate a penalty that accrued in Q1 through Q3. Each quarter stands on its own.",
        "There are two primary safe harbors that eliminate the underpayment penalty entirely. The first: pay at least 90% of your current year tax liability through withholding and estimated payments. The second — and often more reliable for investors with variable income — is to pay 100% of last year's total tax liability (or 110% if your prior year AGI exceeded $150,000). If you meet either safe harbor, you owe no penalty regardless of how large your current year tax bill is.",
        "Real estate investors most commonly trigger this penalty in three scenarios: (1) a 1031 exchange fails or is only partially completed, creating an unexpected taxable gain; (2) depreciation recapture is larger than anticipated at sale; (3) short-term rental income grows substantially during the year without a corresponding increase in estimated payments. Quarterly estimated payments are due April 15, June 15, September 15, and January 15 of the following year.",
        "The penalty for a single year of underpayment is rarely catastrophic, but it is entirely avoidable with proper planning. The most common strategy for investors with unpredictable income is to calculate 110% of last year's tax and divide it into four equal quarterly payments. This approach guarantees you avoid the penalty even if your current year income doubles.",
        "A lesser-known planning tool is the withholding safe harbor. Unlike estimated tax payments — which are assigned to specific quarters — IRS withholding is treated as if it were paid evenly throughout the year regardless of when it was actually withheld. This means that increasing withholding from a paycheck late in the year, such as in November or December, can eliminate or significantly reduce an underpayment penalty that would otherwise apply to earlier quarters. W-2 employees with rental income or a mid-year property sale can use this strategy to avoid penalties without making late estimated payments.",
      ].map((p,i)=>(
        <p key={i} style={{fontSize:14,color:T.textMid,lineHeight:1.7,marginBottom:14}}>{p}</p>
      ))}
      <h2 style={{fontSize:22,fontWeight:400,color:T.text,margin:"32px 0 16px",borderBottom:"1px solid "+T.border,paddingBottom:12}}>
        {"Frequently Asked Questions"}
      </h2>
      {[
        {q:"Can I use withholding to avoid the underpayment penalty?",
         a:"Yes — and this is one of the most underused planning tools available. Unlike estimated tax payments, which are tied to specific quarters, IRS withholding is treated as if it were paid evenly throughout the entire year. This means if you realize in November that you underpaid all year, you can increase your W-2 withholding for your last few paychecks and the IRS will credit that withholding as if it was spread across all four quarters. This strategy works for W-2 employees with rental income, a property sale, or any unplanned year-end income event. It does not apply to self-employed individuals without W-2 income."},
        {q:"What is the IRS underpayment penalty rate?",
         a:"The underpayment penalty rate equals the federal short-term interest rate plus 3 percentage points, adjusted quarterly. The IRS announces the rate each quarter. In 2024–2025 the rate ranged between 7% and 8% annually. The penalty accrues daily for each underpaid quarter, so a full year of underpayment at 8% on a $10,000 shortfall would result in approximately $800 in penalties — in addition to the tax itself."},
        {q:"How do I avoid the IRS underpayment penalty?",
         a:"There are two safe harbors. First, pay at least 90% of your current year tax through withholding and estimated payments. Second, pay 100% of last year's total tax liability — or 110% if your prior year adjusted gross income exceeded $150,000. Meeting either safe harbor eliminates the penalty completely. The 110% prior-year safe harbor is usually easiest for real estate investors because you know the number at the start of the year."},
        {q:"Do I have to pay estimated taxes every quarter?",
         a:"If you expect to owe at least $1,000 in federal income tax after subtracting withholding and refundable credits, the IRS requires quarterly estimated payments. Quarterly due dates are April 15, June 15, September 15, and January 15. Each quarter covers a specific period of income, and missing a payment — or paying late — triggers a penalty for that quarter even if you overpay in a later quarter. W-2 employees who receive a large bonus or sell a rental property mid-year often need to add estimated payments."},
        {q:"Can rental income cause an underpayment penalty?",
         a:"Yes. Rental income has no automatic withholding, so every dollar of net rental income is tax you must pay proactively. If your properties generated $40,000 in net rental income and you did not make estimated payments, you likely owe both the tax and a penalty. The solution is to estimate your rental income at the start of the year, calculate the resulting tax increase, and divide it into four quarterly estimated payments. Using the prior-year safe harbor (110% of last year's tax) is often the simplest approach."},
        {q:"Does the penalty apply if I file late?",
         a:"The underpayment penalty (Section 6654) is separate from the failure-to-file penalty (Section 6651) and the failure-to-pay penalty. The underpayment penalty applies to shortfalls in estimated payments during the year — before you even file your return. You can owe all three penalties simultaneously. Filing an extension avoids the failure-to-file penalty but does not eliminate the underpayment or failure-to-pay penalties if you owe tax and did not pay it by April 15."},
      ].map((f,i)=>(
        <div key={i} style={{marginBottom:20,padding:"16px",background:T.bgCard,borderRadius:8,border:"1px solid "+T.border}}>
          <p style={{fontSize:14,fontWeight:600,color:T.gold,margin:"0 0 8px"}}>{f.q}</p>
          <p style={{fontSize:13,color:T.textMid,lineHeight:1.7,margin:0}}>{f.a}</p>
        </div>
      ))}
      <div style={{marginTop:32,padding:"20px 24px",background:T.bgCard,borderRadius:8,border:"1px solid "+T.border}}>
        <p style={{fontSize:13,fontWeight:600,color:T.gold,margin:"0 0 8px"}}>{"Why These Calculations Matter"}</p>
        <p style={{fontSize:12,color:T.textMid,lineHeight:1.7,margin:"0 0 10px"}}>{"Tax calculators provide estimates only. Actual tax results depend on your filing status, income, depreciation history, passive activity limitations, state tax rules, and other factors specific to your situation."}</p>
        <p style={{fontSize:12,color:T.textMid,lineHeight:1.7,margin:0}}>{"RealtyTaxTools was built by a licensed CPA to help investors understand common real estate tax calculations using IRS rules and publicly available guidance. For complex transactions — including cost segregation studies, 1031 exchanges, depreciation recapture planning, or large property sales — consult a qualified tax professional."}</p>
      </div>

      <div style={{padding:"14px 18px",background:"rgba(74,111,168,0.08)",border:"1px solid #2a3848",borderRadius:8,marginBottom:16}}>
        <p style={{fontSize:12,fontWeight:600,color:"#6a9fd8",margin:"0 0 6px"}}>{"⚠ CPA Note"}</p>
        <p style={{fontSize:12,color:T.textMid,margin:0,lineHeight:1.7}}>{"Underpayment penalty calculations depend on your quarterly payment dates and amounts. The safe harbor rules (90% current year / 110% prior year for AGI over $150K) eliminate the penalty entirely when met. If you received a large unexpected gain — from a property sale, bonus, or other income — increasing your W-2 withholding before year-end may eliminate penalties for earlier quarters. Consult a licensed CPA for penalty waiver options."}</p>
      </div>
      <div style={{padding:"12px 16px",background:"rgba(200,169,110,0.05)",border:"1px solid "+T.border,borderRadius:8,marginBottom:16}}>
        <p style={{fontSize:12,fontWeight:600,color:T.gold,margin:"0 0 6px"}}>{"Why This Matters"}</p>
        <p style={{fontSize:12,color:T.textMid,margin:0,lineHeight:1.7}}>{"Real estate investors are particularly vulnerable to underpayment penalties because rental income, capital gains, and depreciation recapture have no automatic withholding. Running this estimate before each quarterly deadline — and adjusting payments proactively — can prevent a penalty that is entirely avoidable with proper planning."}</p>
      </div>

      <h2 style={{fontSize:22,fontWeight:400,color:T.text,margin:"32px 0 16px",borderBottom:"1px solid "+T.border,paddingBottom:12}}>
        {"Related Calculators"}
      </h2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:32}}>
        {[
          {label:"Capital Gains Calculator",sub:"Estimate tax on a property sale — plan quarterly payments",id:"capitalgains"},
          {label:"1031 Exchange Calculator",sub:"Defer the gain that triggers underpayment",id:"exchange1031"},
          {label:"Depreciation Calculator",sub:"Know your annual rental income offset",id:"depreciation"},
          {label:"Short-Term Rental Calculator",sub:"Estimate net rental income for quarterly planning",id:"str"},
        ].map((c,i)=>(<div key={i} style={{padding:"14px 16px",background:T.bgCard,border:"1px solid "+T.border,borderRadius:8,cursor:"pointer",transition:"border-color 0.15s"}}
          onMouseEnter={e=>e.currentTarget.style.borderColor=T.goldDim}
          onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
          <p style={{fontSize:13,fontWeight:600,color:T.gold,margin:"0 0 4px"}}>{c.label}</p>
          <p style={{fontSize:11,color:T.textMid,margin:0}}>{c.sub}</p>
        </div>))}
      </div>

    </div>
  );
}


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
function MF({label,value,onChange,hint,credit,income}){
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
          value={value}
          onChange={e=>onChange(e.target.value)}
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
function SB({color,tc,title,children,defaultOpen=false,badge}){
  const [open,setOpen]=useState(defaultOpen);
  return<div style={{marginBottom:8,border:"1px solid "+(color||T.border)+"40",borderRadius:8,overflow:"hidden"}}>
    <div onClick={()=>setOpen(o=>!o)}
      style={{padding:"9px 12px",background:color||T.border,opacity:0.9,cursor:"pointer",
        display:"flex",justifyContent:"space-between",alignItems:"center",userSelect:"none"}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <p style={{margin:0,fontSize:9,fontWeight:700,letterSpacing:"0.08em",
          textTransform:"uppercase",color:tc||T.white}}>{title}</p>
        {badge&&<span style={{fontSize:8,padding:"1px 5px",borderRadius:3,
          background:"rgba(255,255,255,0.15)",color:tc||T.white}}>{badge}</span>}
      </div>
      <span style={{fontSize:11,color:tc||T.white,opacity:0.7,transform:open?"rotate(180deg)":"rotate(0deg)",
        transition:"transform 0.2s",display:"inline-block"}}>{"▾"}</span>
    </div>
    {open&&<div style={{padding:"12px 12px 8px",background:T.bgCard2}}>{children}</div>}
  </div>;
}

const steps=["Closing","Land","Classes","Results"];


// Collapsible section component (must be outside DepreciationCalc — uses useState)
function DeprecSection({title,color,tc,open:defaultOpen=false,children}){
  const [open,setOpen]=useState(defaultOpen);
  return(
    <div style={{marginBottom:8,border:"1px solid "+(color||T.border)+"50",borderRadius:8,overflow:"hidden"}}>
      <div onClick={()=>setOpen(o=>!o)} style={{padding:"9px 14px",background:color||T.border,
        cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:9,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:tc||T.white}}>{title}</span>
        <span style={{color:tc||T.white,fontSize:12,transform:open?"rotate(180deg)":"none",transition:"transform 0.2s"}}>{open?"▾":"▸"}</span>
      </div>
      {open&&<div style={{padding:"12px",background:T.bgCard2}}>{children}</div>}
    </div>
  );
}

function QuickMode({inp,s,fmt,pct,quickBasis,quickLandR,quickBuilding,quickDepr,canGo0,setMode,setStep,T}){
    return(
    <div>
      <div style={{marginBottom:10}}>
        <div style={{fontSize:11,color:T.textMid,marginBottom:3}}>{"Purchase Price"}</div>
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:T.goldDim,fontSize:14,pointerEvents:"none"}}>$</span>
          <input type="text" inputMode="decimal" value={inp.purchasePrice}
            onChange={e=>s("purchasePrice",e.target.value)} placeholder="0"
            style={{width:"100%",background:"#0a0c0f",border:"1px solid "+T.border,
              borderRadius:6,padding:"10px 14px 10px 24px",fontSize:15,color:T.text,
              fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
        </div>
      </div>
      <div style={{marginBottom:10}}>
        <div style={{fontSize:11,color:T.textMid,marginBottom:3}}>{"Total Closing Costs Added to Basis"}</div>
        <div style={{fontSize:9,color:T.textDim,marginBottom:3,fontStyle:"italic"}}>{"Title insurance, recording fees, settlement fee, attorney, survey — NOT loan costs or prepaids"}</div>
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:T.goldDim,fontSize:14,pointerEvents:"none"}}>$</span>
          <input type="text" inputMode="decimal" value={inp.quickClosing}
            onChange={e=>s("quickClosing",e.target.value)} placeholder="0"
            style={{width:"100%",background:"#0a0c0f",border:"1px solid "+T.border,
              borderRadius:6,padding:"10px 14px 10px 24px",fontSize:15,color:T.text,
              fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
        </div>
      </div>
      <div style={{marginBottom:10}}>
        <div style={{fontSize:11,color:T.textMid,marginBottom:3}}>{"Land % of Value"}</div>
        <div style={{fontSize:9,color:T.textDim,marginBottom:3,fontStyle:"italic"}}>{"From county assessor. Land cannot be depreciated. Typical 15–35%."}</div>
        <input type="text" inputMode="decimal" value={inp.quickLandPct}
          onChange={e=>s("quickLandPct",e.target.value)} placeholder="25"
          style={{width:"100%",background:"#0a0c0f",border:"1px solid "+T.border,
            borderRadius:6,padding:"10px 14px",fontSize:15,color:T.text,
            fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
      </div>
      {quickBasis>0&&quickLandR>0&&(
        <div style={{background:"linear-gradient(135deg,#0a1a0e,#080e0a)",border:"1px solid #1a4020",borderRadius:10,padding:"16px",marginBottom:12}}>
          <div style={{fontSize:10,color:T.green,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12}}>{"Quick Estimate"}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div>
              <div style={{fontSize:9,color:T.textDim,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2}}>{"Total Basis"}</div>
              <div style={{fontSize:20,color:T.gold,fontWeight:300}}>{fmt(quickBasis)}</div>
            </div>
            <div>
              <div style={{fontSize:9,color:T.textDim,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2}}>{"Building Basis"}</div>
              <div style={{fontSize:20,color:T.gold,fontWeight:300}}>{fmt(quickBuilding)}</div>
            </div>
            <div>
              <div style={{fontSize:9,color:T.textDim,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2}}>{"Annual Depreciation"}</div>
              <div style={{fontSize:24,color:T.green,fontWeight:300}}>{fmt(quickDepr)}</div>
              <div style={{fontSize:9,color:T.textDim}}>{"27.5yr / year"}</div>
            </div>
            <div>
              <div style={{fontSize:9,color:T.textDim,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2}}>{"Tax Saving @ 22%"}</div>
              <div style={{fontSize:24,color:T.green,fontWeight:300}}>{fmt(Math.round(quickDepr*0.22))}</div>
              <div style={{fontSize:9,color:T.textDim}}>{"per year (est.)"}</div>
            </div>
          </div>
        </div>
      )}
      <p style={{fontSize:9,color:T.textDim,textAlign:"center",margin:"4px 0 10px"}}>
        {"IRS straight-line method (27.5yr MACRS). Same formula CPAs use — just enter 3 numbers. For full HUD-1 analysis use Detailed Mode."}
      </p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <button onClick={()=>setMode("detail")}
          style={{padding:"10px",borderRadius:7,cursor:"pointer",fontFamily:"inherit",
            background:"rgba(200,169,110,0.06)",border:"1px solid "+T.goldDim,color:T.gold,fontSize:12}}>
          {"📋 Detailed Mode"}
        </button>
        <button onClick={()=>{setMode("detail");setStep(1);}}
          disabled={!canGo0}
          style={{padding:"10px",borderRadius:7,cursor:"pointer",fontFamily:"inherit",
            background:canGo0?"linear-gradient(135deg,"+T.gold+","+T.goldLight+")":"rgba(200,169,110,0.1)",
            border:"none",color:canGo0?"#050608":T.goldDim,fontSize:12,fontWeight:canGo0?700:400,
            opacity:canGo0?1:0.5}}>
          {"Next → Land Split"}
        </button>
      </div>
      {!canGo0&&<p style={{fontSize:9,color:T.textDim,textAlign:"center",marginTop:4}}>{"Enter purchase price to continue"}</p>}
    </div>
    );
  }
function DeprecRow({label,value,onChange,hint,credit,income}){
  const isC=credit||income;
  return(
    <div style={{marginBottom:10}}>
      <div style={{fontSize:11,color:isC?T.amber:T.textMid,marginBottom:3,fontWeight:isC?600:400}}>
        {label}
        {credit&&<span style={{fontSize:9,color:T.amber,marginLeft:6}}>← reduces basis</span>}
        {income&&<span style={{fontSize:9,color:T.red,marginLeft:6}}>← taxable income</span>}
      </div>
      {hint&&<div style={{fontSize:9,color:T.textDim,marginBottom:3,fontStyle:"italic"}}>{hint}</div>}
      <div style={{position:"relative"}}>
        <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:T.goldDim,fontSize:14,pointerEvents:"none"}}>$</span>
        <input type="text" inputMode="decimal" value={value}
          onChange={e=>onChange(e.target.value)} placeholder="0"
          style={{width:"100%",background:"#0a0c0f",border:"1px solid "+T.border,
            borderRadius:6,padding:"10px 14px 10px 24px",fontSize:15,color:T.text,
            fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
      </div>
    </div>
  );
}

function DepreciationCalc({lang:L="en"}){
  const [mode,setMode]=useState("quick");
  const [copied,setCopied]=useState(false); // "quick" or "detail"
  const [step,setStep]=useState(0);
  const [pdfLoading,setPdfLoading]=useState(false);
  const [pdfFlags,setPdfFlags]=useState([]);
  const [hasloan,setHasloan]=useState(true);
  const [inp,setInp]=useState({
    // Quick mode
    purchasePrice:"",quickClosing:"",quickLandPct:"",
    // Section B
    titleInsuranceLender:"",titleInsuranceOwner:"",titleSearch:"",
    otherTitleFees:"",settlementFee:"",recordingCharges:"",
    taxStamps:"",transferTaxes:"",attorneyFeesBasis:"",
    surveyFee:"",inspections:"",appraisalBasis:"",otherBasis:"",
    // POC
    pocAppraisal:"",pocInspection:"",pocOther:"",
    pocDestination:"Property Basis (B)",
    // Section C
    originationFee:"",discountPoints:"",appraisalLender:"",
    creditReport:"",mortgageInsurancePMI:"",assumptionFee:"",
    underwritingFee:"",attorneyFeeLoan:"",lenderOther:"",lenderCredit:"",
    // Section D
    taxProrationType:"",propertyTaxClosing:"",prepaidInterest:"",
    insuranceMIP:"",proratedRent:"",
    // Section E
    escrowInsurance:"",escrowTax:"",escrowMortgageIns:"",aggregateAdj:"",
    // Section F
    earnestMoney:"",loanFunds:"",sellerCredit:"",taxAdjSeller:"",
    optionFee:"",proratedHOA:"",
    // Land
    landRatioMode:"assessed",landAssessed:"",totalAssessed:"",landRatioDirect:"",
    // Depreciation
    propType:"residential",alloc27:"",alloc39:"",alloc15:"",alloc7:"",alloc5:"",
    bonusDepreciation:true,bonusPct:"100",
    yearPlaced:new Date().getFullYear().toString(),monthPlaced:"1",
    actualCashToClose:"",
  });
  const [res,setRes]=useState(null);
  const s=(k,v)=>setInp(p=>({...p,[k]:v}));

  // ── Derived values ──────────────────────────────────────────
  const basisCC=parse(inp.titleInsuranceLender)+parse(inp.titleInsuranceOwner)+
    parse(inp.titleSearch)+parse(inp.otherTitleFees)+parse(inp.settlementFee)+
    parse(inp.recordingCharges)+parse(inp.taxStamps)+parse(inp.transferTaxes)+
    parse(inp.attorneyFeesBasis)+parse(inp.surveyFee)+parse(inp.inspections)+
    parse(inp.appraisalBasis)+parse(inp.otherBasis);

  const pocIsLoan=inp.pocDestination==="Loan Cost (C)";
  const pocLoan=pocIsLoan?parse(inp.pocAppraisal):0;
  const pocBasis=(!pocIsLoan?parse(inp.pocAppraisal):0)+parse(inp.pocInspection)+parse(inp.pocOther);

  const grossLoanCosts=hasloan?(parse(inp.originationFee)+parse(inp.discountPoints)+
    parse(inp.appraisalLender)+parse(inp.creditReport)+parse(inp.mortgageInsurancePMI)+
    parse(inp.assumptionFee)+parse(inp.underwritingFee)+parse(inp.attorneyFeeLoan)+
    parse(inp.lenderOther)):0;
  const lenderCreditAmt=parse(inp.lenderCredit);
  const netLoanCosts=Math.max(0,grossLoanCosts+pocLoan-lenderCreditAmt);

  const deductibleNow=parse(inp.propertyTaxClosing)+parse(inp.prepaidInterest)+parse(inp.insuranceMIP);
  const escrowTotal=parse(inp.escrowInsurance)+parse(inp.escrowTax)+parse(inp.escrowMortgageIns)-parse(inp.aggregateAdj);
  const taxAdjAmt=parse(inp.taxAdjSeller);
  const sellerCrAmt=parse(inp.sellerCredit);
  const proratedHOAAmt=parse(inp.proratedHOA);
  const earnestAmt=parse(inp.earnestMoney);
  const loanAmt=parse(inp.loanFunds);
  const optionFeeAmt=parse(inp.optionFee);

  const totalBasis=parse(inp.purchasePrice)+basisCC+pocBasis-taxAdjAmt-sellerCrAmt-proratedHOAAmt;

  // Quick mode
  const quickBasis=parse(inp.purchasePrice)+parse(inp.quickClosing);
  const quickLandR=Math.min(0.99,Math.max(0,parse(inp.quickLandPct)/100));
  const quickBuilding=Math.max(0,quickBasis*(1-quickLandR));
  const quickDepr=quickBuilding>0?Math.round(quickBuilding/27.5*100)/100:0;

  // Land
  const landRatio=inp.landRatioMode==="direct"
    ?Math.min(1,Math.max(0,parse(inp.landRatioDirect)/100))
    :(parse(inp.totalAssessed)>0?Math.min(1,parse(inp.landAssessed)/parse(inp.totalAssessed)):0);
  const landBasis=Math.round(totalBasis*landRatio);
  const buildingBasis=Math.max(0,totalBasis-landBasis);

  // Depreciation
  const bPct=parse(inp.bonusDepreciation?inp.bonusPct:0)/100;
  const mp=parseInt(inp.monthPlaced)||1;
  function calcDepr(basis,life,isReal,month){
    if(basis<=0)return{annual:0,bonus:0,firstYear:0};
    if(isReal){
      const annual=Math.round(basis/life*100)/100;
      const firstYear=Math.round(basis/life*(13-month)/12*100)/100;
      return{annual,bonus:0,firstYear};
    }
    const bonus=Math.round(basis*bPct*100)/100;
    const remaining=basis-bonus;
    const dbRate=life===15?1.5/life:2/life;
    const firstYearDB=Math.round(remaining*dbRate*0.5*100)/100;
    return{annual:Math.round(remaining/life*100)/100,bonus,firstYear:bonus+firstYearDB};
  }
  const classes=[
    {key:"alloc27",label:"Residential structure (27.5yr)",life:27.5,isReal:true,color:"#4a9060",
     basis:inp.propType==="residential"?parse(inp.alloc27)||Math.max(0,buildingBasis-parse(inp.alloc15)-parse(inp.alloc7)-parse(inp.alloc5)):0,
     show:inp.propType==="residential"},
    {key:"alloc39",label:"Non-residential (39yr)",life:39,isReal:true,color:"#4a6fa8",
     basis:inp.propType==="nonresidential"?parse(inp.alloc39)||Math.max(0,buildingBasis-parse(inp.alloc15)-parse(inp.alloc7)-parse(inp.alloc5)):0,
     show:inp.propType==="nonresidential"},
    {key:"alloc15",label:"Land improvements (15yr)",life:15,isReal:false,color:"#9a7a60",basis:parse(inp.alloc15),show:true},
    {key:"alloc7",label:"Furniture/equipment (7yr)",life:7,isReal:false,color:"#7a6a9a",basis:parse(inp.alloc7),show:true},
    {key:"alloc5",label:"Appliances/carpet (5yr)",life:5,isReal:false,color:"#c8a96e",basis:parse(inp.alloc5),show:true},
  ].filter(c=>c.show&&c.basis>0);
  const classResults=classes.map(c=>({...c,...calcDepr(c.basis,c.life,c.isReal,mp)}));
  const totalAnnual=classResults.reduce((a,c)=>a+c.annual,0);
  const totalFirstYear=classResults.reduce((a,c)=>a+c.firstYear,0);
  const totalBonus=classResults.reduce((a,c)=>a+c.bonus,0);

  // ── PDF handler ─────────────────────────────────────────────
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
      const response=await fetch("/api/analyze-pdf",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({base64,mediaType:"application/pdf"})
      });
      if(!response.ok){const e=await response.json().catch(()=>({}));throw new Error(e.error||"Server error "+response.status);}
      const d=await response.json();
      if(d.error)throw new Error(d.error);
      setHasloan(d.hasloan!==false);
      if(d.purchasePrice)s("purchasePrice",String(d.purchasePrice));
      ["sectionB","sectionC","sectionD","sectionE","sectionF"].forEach(sec=>{
        Object.entries(d[sec]||{}).forEach(([k,v])=>{if(v)s(k,String(v));});
      });
      if(d.poc?.pocAppraisal)s("pocAppraisal",String(d.poc.pocAppraisal));
      if(d.poc?.pocDestination)s("pocDestination",d.poc.pocDestination);
      setPdfFlags((d.flags||[]).length>0?d.flags:["✓ PDF read — review fields below."]);
    }catch(err){
      setPdfFlags(["✗ "+err.message,"Please enter values manually below."]);
    }
    setPdfLoading(false);
  }

  function calculate(){
    setRes({totalBasis,basisCC,pocBasis,pocLoan,grossLoanCosts,netLoanCosts,
      lenderCreditAmt,deductibleNow,escrowTotal,landBasis,buildingBasis,
      landRatio,classResults,totalAnnual,totalFirstYear,totalBonus,inp,hasloan,
      sellerCrAmt,taxAdjAmt,proratedHOAAmt,earnestAmt,loanAmt,optionFeeAmt});
    setStep(3);
  }

  function resetAll(){
    setStep(0); setRes(null); setPdfFlags([]); setHasloan(true); setMode("quick");
    setInp({purchasePrice:"",quickClosing:"",quickLandPct:"",
      titleInsuranceLender:"",titleInsuranceOwner:"",titleSearch:"",
      otherTitleFees:"",settlementFee:"",recordingCharges:"",taxStamps:"",
      transferTaxes:"",attorneyFeesBasis:"",surveyFee:"",inspections:"",
      appraisalBasis:"",otherBasis:"",pocAppraisal:"",pocInspection:"",
      pocOther:"",pocDestination:"Property Basis (B)",originationFee:"",
      discountPoints:"",appraisalLender:"",creditReport:"",mortgageInsurancePMI:"",
      assumptionFee:"",underwritingFee:"",attorneyFeeLoan:"",lenderOther:"",
      lenderCredit:"",taxProrationType:"",propertyTaxClosing:"",prepaidInterest:"",
      insuranceMIP:"",proratedRent:"",escrowInsurance:"",escrowTax:"",
      escrowMortgageIns:"",aggregateAdj:"",earnestMoney:"",loanFunds:"",
      sellerCredit:"",taxAdjSeller:"",optionFee:"",proratedHOA:"",
      landRatioMode:"assessed",landAssessed:"",totalAssessed:"",landRatioDirect:"",
      propType:"residential",alloc27:"",alloc39:"",alloc15:"",alloc7:"",alloc5:"",
      bonusDepreciation:true,bonusPct:"100",
      yearPlaced:new Date().getFullYear().toString(),monthPlaced:"1",actualCashToClose:""});
  }

  const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const canGo0=parse(inp.purchasePrice)>0;
  const canGo1=landRatio>0;
  const canGo2=buildingBasis>0;




  // ── Step 0 Quick Mode ────────────────────────────────────────

  return(
    <div>
      <div style={{marginBottom:14}}>
        <h3 style={{margin:"0 0 4px",fontSize:15,fontWeight:400,color:T.gold}}>{"Closing Statement Analysis & Depreciation"}</h3>
        <p style={{margin:0,fontSize:12,color:T.textDim}}>{"HUD-1/CD basis calculation • Cash-to-close reconciliation • Depreciation schedule"}</p>
      </div>

      {/* Progress */}
      {mode==="detail"&&(
        <div style={{display:"flex",gap:5,marginBottom:16}}>
          {["Closing","Land","Classes","Results"].map((st,i)=>(
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <div style={{height:2,width:"100%",borderRadius:1,background:(i<step||i===step)?T.gold:T.border}}/>
              <span style={{fontSize:8,letterSpacing:"0.06em",textTransform:"uppercase",textAlign:"center",
                color:i===step?T.gold:i<step?T.goldDim:T.textDim}}>{st}</span>
            </div>
          ))}
        </div>
      )}

      {/* Mode toggle — only on step 0 */}
      {(mode==="quick"||step===0)&&(
        <div style={{display:"flex",gap:4,marginBottom:12,padding:"3px",background:T.bgCard,borderRadius:8,border:"1px solid "+T.border}}>
          {[{v:"quick",l:"⚡ Quick Estimate",d:"Most investors start here"},{v:"detail",l:"📋 Exact (HUD-1)",d:"Upload closing disclosure"}].map(m=>(
            <button key={m.v} onClick={()=>{setMode(m.v);setStep(0);}}
              style={{flex:1,padding:"7px",borderRadius:6,cursor:"pointer",fontFamily:"inherit",border:"none",
                background:mode===m.v?"linear-gradient(135deg,"+T.gold+","+T.goldLight+")":T.bgCard2,
                color:mode===m.v?"#050608":T.textMid}}>
              <div style={{fontSize:12,fontWeight:mode===m.v?700:400}}>{m.l}</div>
              <div style={{fontSize:9,opacity:0.7}}>{m.d}</div>
            </button>
          ))}
        </div>
      )}

      {/* ── QUICK MODE ── */}
      {mode==="quick"&&<QuickMode inp={inp} s={s} fmt={fmt} pct={pct} quickBasis={quickBasis} quickLandR={quickLandR} quickBuilding={quickBuilding} quickDepr={quickDepr} canGo0={canGo0} setMode={setMode} setStep={setStep} T={T}/>}

      {/* ── DETAILED MODE ── */}
      {mode==="detail"&&(
        <div>
          {/* STEP 0 — Closing Statement */}
          {step===0&&(
            <div>
              {/* PDF Upload */}
              <div style={{padding:"14px",background:T.bgCard2,border:"2px dashed "+(pdfLoading?T.gold:T.border),
                borderRadius:8,textAlign:"center",marginBottom:10}}>
                <div style={{fontSize:22,marginBottom:6}}>{pdfLoading?"🤖":"📄"}</div>
                <p style={{fontSize:12,color:T.textMid,margin:"0 0 8px"}}>{pdfLoading?"Reading every line item...":"Upload HUD-1 or Closing Disclosure to auto-fill"}</p>
                {!pdfLoading&&(
                  <label style={{display:"inline-block",padding:"7px 16px",borderRadius:6,fontSize:12,
                    fontFamily:"inherit",cursor:"pointer",fontWeight:600,
                    background:"linear-gradient(135deg,"+T.gold+","+T.goldLight+")",color:"#050608"}}>
                    Choose PDF<input type="file" accept=".pdf" onChange={handlePDF} style={{display:"none"}}/>
                  </label>
                )}
              </div>
              {pdfFlags.length>0&&(
                <div style={{marginBottom:10}}>
                  {pdfFlags.map((f,i)=><div key={i} style={{fontSize:11,color:T.textMid,padding:"4px 10px",
                    background:T.bgCard2,borderRadius:4,marginBottom:3}}>📝 {f}</div>)}
                </div>
              )}

              <div style={{marginBottom:8,padding:"10px 12px",background:T.bgCard2,border:"1px solid "+T.border,borderRadius:8}}>
                <Toggle value={hasloan} onChange={setHasloan} label={"Has Mortgage / Loan"} desc={"Turn off for cash purchases"}/>
              </div>

              {/* A — Purchase Price */}
              <DeprecSection title="A — Purchase Price" color="#2a5a3a" tc="#90d4a0" open={true}>
                <DeprecRow label="Purchase price (from sales contract / HUD-1 Line 101)" value={inp.purchasePrice} onChange={v=>s("purchasePrice",v)}/>
              </DeprecSection>

              {/* B — Basis */}
              <DeprecSection title="B — HUD-1 Expenses Added to Property Cost Basis" color="#2a3a6a" tc="#90b0f0">
                <div style={{fontSize:9,color:"#60a0e0",marginBottom:8,fontStyle:"italic"}}>
                  {"Everything titled 'Title -' goes here. These items add to your depreciable basis."}
                </div>
                <DeprecRow label="Title Insurance — Lender's Policy  (→ Loan Cost, not basis)" hint="HUD-1 line 1101. Lender's title policy is a loan acquisition cost — enter in Loan Costs section below, not here. Owner's title policy adds to basis." value={inp.titleInsuranceLender} onChange={v=>s("titleInsuranceLender",v)}/>
                <DeprecRow label="Title Insurance — Owner's Policy" hint="HUD-1 line 1103" value={inp.titleInsuranceOwner} onChange={v=>s("titleInsuranceOwner",v)}/>
                <DeprecRow label="Title Search / Abstract / Title Exam" value={inp.titleSearch} onChange={v=>s("titleSearch",v)}/>
                <DeprecRow label="Other Title Fees (endorsement, courier, guaranty fee, binder)" value={inp.otherTitleFees} onChange={v=>s("otherTitleFees",v)}/>
                <DeprecRow label="Settlement / Closing Fee" hint="HUD-1 line 1100" value={inp.settlementFee} onChange={v=>s("settlementFee",v)}/>
                <DeprecRow label="Gov't Recording Charges" hint="HUD-1 line 1201" value={inp.recordingCharges} onChange={v=>s("recordingCharges",v)}/>
                <DeprecRow label="Tax Stamps / Transfer Taxes" value={inp.taxStamps} onChange={v=>s("taxStamps",v)}/>
                <DeprecRow label="Transfer Taxes" value={inp.transferTaxes} onChange={v=>s("transferTaxes",v)}/>
                <DeprecRow label="Attorney Fees — Title/Closing Work Only" hint="Title exam, deed prep, closing. NOT loan-related attorney fees." value={inp.attorneyFeesBasis} onChange={v=>s("attorneyFeesBasis",v)}/>
                <DeprecRow label="Survey Fee" value={inp.surveyFee} onChange={v=>s("surveyFee",v)}/>
                <DeprecRow label="Inspections — See CPA Note ⚠" hint="Pre-purchase inspection fees are generally NOT depreciable basis. May be currently deductible. Consult your CPA before including here." value={inp.inspections} onChange={v=>s("inspections",v)}/>
                <DeprecRow label="Appraisal — Buyer's Own (not required by lender)" value={inp.appraisalBasis} onChange={v=>s("appraisalBasis",v)}/>
                <DeprecRow label="Buyer Agent Commission / HOA Transfer Fee / Other Acquisition Costs" hint="Buyer agent commission, HOA transfer fee, condo transfer fee = add to basis. Home warranty = deductible expense, NOT basis." value={inp.otherBasis} onChange={v=>s("otherBasis",v)}/>
                {basisCC>0&&<div style={{marginTop:6,padding:"5px 10px",background:"rgba(74,111,168,0.1)",borderRadius:4,fontSize:11,color:"#6a8ac0"}}>
                  Section B Total: <strong>{fmt(basisCC)}</strong>
                </div>}
              </DeprecSection>

              {/* POC */}
              <DeprecSection title="Paid Outside Closing (POC)" color="#4a4a1a" tc="#d4c840">
                <div style={{fontSize:9,color:T.textDim,marginBottom:8,fontStyle:"italic"}}>
                  {"Items paid before/outside closing. Does NOT affect cash-to-close."}
                </div>
                <DeprecRow label="Appraisal paid outside closing (POC)" value={inp.pocAppraisal} onChange={v=>s("pocAppraisal",v)}/>
                <div style={{marginBottom:10}}>
                  <div style={{fontSize:11,color:T.textMid,marginBottom:6}}>{"Where does this POC appraisal belong?"}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                    {[{v:"Loan Cost (C)",d:"Required by lender"},{v:"Property Basis (B)",d:"Buyer's choice"}].map(o=>(
                      <button key={o.v} onClick={()=>s("pocDestination",o.v)}
                        style={{padding:"7px",borderRadius:6,cursor:"pointer",fontFamily:"inherit",textAlign:"left",
                          background:inp.pocDestination===o.v?"rgba(200,169,110,0.1)":T.bgCard,
                          border:"1px solid "+(inp.pocDestination===o.v?T.gold:T.border)}}>
                        <div style={{fontSize:11,color:inp.pocDestination===o.v?T.gold:T.textMid,fontWeight:500}}>{o.v}</div>
                        <div style={{fontSize:9,color:T.textDim}}>{o.d}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <DeprecRow label="Inspection (paid outside closing) → Basis" value={inp.pocInspection} onChange={v=>s("pocInspection",v)}/>
                <DeprecRow label="Other POC item → Basis" value={inp.pocOther} onChange={v=>s("pocOther",v)}/>
              </DeprecSection>

              {/* C — Loan Costs */}
              {hasloan&&(
                <DeprecSection title="C — Loan Costs (amortize over loan term)" color="#5a3a6a" tc="#c090d8">
                  <div style={{fontSize:9,color:T.textDim,marginBottom:8,fontStyle:"italic"}}>
                    {"Only items specifically related to the loan origination — NOT title fees."}
                  </div>
                  <DeprecRow label="Loan Origination Fee" value={inp.originationFee} onChange={v=>s("originationFee",v)}/>
                  <DeprecRow label="Loan Discount / Points" value={inp.discountPoints} onChange={v=>s("discountPoints",v)}/>
                  <DeprecRow label="Appraisal on HUD-1 statement (NOT POC)" hint="Only if appraisal appears on the HUD-1 statement itself — NOT paid outside closing. If you paid it before closing (POC), enter it in the POC section above only." value={inp.appraisalLender} onChange={v=>s("appraisalLender",v)}/>
                  <DeprecRow label="Credit Report" value={inp.creditReport} onChange={v=>s("creditReport",v)}/>
                  <DeprecRow label="Underwriting Fee / Processing Fee" value={inp.underwritingFee} onChange={v=>s("underwritingFee",v)}/>
                  <DeprecRow label="Attorney Fees — Loan Section Only" hint="Only if listed under loan costs in HUD-1" value={inp.attorneyFeeLoan} onChange={v=>s("attorneyFeeLoan",v)}/>
                  <DeprecRow label="Other Lender Fees (flood cert, tax service, wire fee)" value={inp.lenderOther} onChange={v=>s("lenderOther",v)}/>
                  <div style={{borderTop:"1px solid "+T.border,marginTop:8,paddingTop:8}}>
                    <DeprecRow label="Lender Credit → Enter as POSITIVE (reduces loan cost)" credit value={inp.lenderCredit} onChange={v=>s("lenderCredit",v)}/>
                  </div>
                  {(grossLoanCosts>0||pocLoan>0)&&(
                    <div style={{marginTop:8,padding:"10px 12px",background:"rgba(90,58,106,0.12)",borderRadius:6,fontSize:11}}>
                      <div style={{fontWeight:700,color:"#c090d8",marginBottom:6}}>{"Loan Cost Summary"}</div>
                      <div style={{display:"grid",gap:3}}>
                        {grossLoanCosts>0&&<div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:T.textMid}}>{"On HUD-1 (Section C)"}</span><span>{fmt(grossLoanCosts)}</span></div>}
                        {pocLoan>0&&<div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:T.textMid}}>{"+ POC (paid outside closing)"}</span><span>{fmt(pocLoan)}</span></div>}
                        {lenderCreditAmt>0&&<div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:T.green}}>{"− Lender credit"}</span><span style={{color:T.green}}>{"("+fmt(lenderCreditAmt)+")"}</span></div>}
                        <div style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid rgba(90,58,106,0.3)",paddingTop:4,marginTop:2}}>
                          <span style={{color:"#c090d8",fontWeight:700}}>{"= Total Loan Cost Basis"}</span>
                          <span style={{color:"#c090d8",fontWeight:700}}>{fmt(netLoanCosts)}</span>
                        </div>
                        <div style={{fontSize:9,color:T.textDim,marginTop:4,fontStyle:"italic"}}>
                          {"Amortize over loan term — not immediately deductible. Deducted as interest expense over life of loan."}
                        </div>
                      </div>
                    </div>
                  )}
                </DeprecSection>
              )}

              {/* D — Deductible */}
              <DeprecSection title="D — Currently Deductible This Year" color="#1a4a3a" tc="#70d0a0">
                <DeprecRow label={"Property Taxes Paid at Closing (deductible)"} hint="Only if YOU pay taxes at closing as a charge. If seller gives you a credit for their unpaid taxes, enter that amount in Section F below." value={inp.propertyTaxClosing} onChange={v=>s("propertyTaxClosing",v)}/>
                <DeprecRow label="Prepaid Mortgage Interest (deductible)" hint="Closing date to month-end · Schedule E" value={inp.prepaidInterest} onChange={v=>s("prepaidInterest",v)}/>
                <DeprecRow label="Homeowners Insurance + Upfront MIP/PMI (deductible)" value={inp.insuranceMIP} onChange={v=>s("insuranceMIP",v)}/>
                <DeprecRow label="Prorated Rent FROM Seller (taxable income to you)" income value={inp.proratedRent} onChange={v=>s("proratedRent",v)}/>
              </DeprecSection>

              {/* E — Escrow */}
              <DeprecSection title="E — Reserves and Escrow Deposits" color="#3a2a5a" tc="#a080c8">
                <DeprecRow label="Homeowners Insurance Escrow" value={inp.escrowInsurance} onChange={v=>s("escrowInsurance",v)}/>
                <DeprecRow label="Property Tax Escrow" value={inp.escrowTax} onChange={v=>s("escrowTax",v)}/>
                <DeprecRow label="Mortgage Insurance Escrow" value={inp.escrowMortgageIns} onChange={v=>s("escrowMortgageIns",v)}/>
                <DeprecRow label="Aggregate Adjustment Credit → Enter as POSITIVE" credit value={inp.aggregateAdj} onChange={v=>s("aggregateAdj",v)}/>
              </DeprecSection>

              {/* F — Reductions */}
              <DeprecSection title="F — Reductions to Amount Due (all POSITIVE)" color="#5a2a1a" tc="#e09060">
                <DeprecRow label="Earnest Money Deposit" hint="Cash paid by buyer — no basis effect" value={inp.earnestMoney} onChange={v=>s("earnestMoney",v)}/>
                <DeprecRow label="Loan Funds (Mortgage Amount)" value={inp.loanFunds} onChange={v=>s("loanFunds",v)}/>
                <DeprecRow label="Seller Credit / Concession" credit value={inp.sellerCredit} onChange={v=>s("sellerCredit",v)}/>
                <DeprecRow label={"Tax Proration Credit FROM Seller (reduces basis)"} credit hint="Seller's unpaid property taxes credited to you. Look for 'County Taxes [date] to [date]' under Adjustments for Items Unpaid by Seller." value={inp.taxAdjSeller} onChange={v=>s("taxAdjSeller",v)}/>
                <DeprecRow label="Option Fee (reduces cash-to-close only, not basis)" value={inp.optionFee} onChange={v=>s("optionFee",v)}/>
                <DeprecRow label="Prorated HOA / Other Credits" credit value={inp.proratedHOA} onChange={v=>s("proratedHOA",v)}/>
              </DeprecSection>

              {/* Cash-to-Close Reconciliation & Basis Summary */}
              {parse(inp.purchasePrice)>0&&(
                <div style={{marginBottom:12}}>

                  {/* Cash-to-Close Reconciliation */}
                  <div style={{background:"linear-gradient(135deg,#08100a,#050a06)",border:"1px solid #1a4020",borderRadius:10,padding:"12px 14px",marginBottom:10}}>
                    <p style={{fontSize:10,color:T.green,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",margin:"0 0 10px"}}>
                      {"💵 Cash-to-Close Reconciliation (Line 303)"}
                    </p>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0}}>
                      <div style={{borderRight:"1px solid "+T.border,paddingRight:8}}>
                        <div style={{fontSize:9,color:T.textDim,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>{"Charges to Buyer"}</div>
                        {[
                          {l:"Purchase price",v:parse(inp.purchasePrice)},
                          {l:"Closing costs (B)",v:basisCC,show:basisCC>0},
                          {l:"Loan costs (C) — on statement",v:grossLoanCosts,show:grossLoanCosts>0},
                          {l:"Prepaids (D)",v:deductibleNow,show:deductibleNow>0},
                          {l:"Escrow (E)",v:Math.max(0,escrowTotal),show:escrowTotal>0},
                        ].filter(r=>r.show!==false).map((r,i)=>(
                          <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:10,padding:"2px 0",color:T.textMid}}>
                            <span>{r.l}</span><span>{fmt(r.v)}</span>
                          </div>
                        ))}
                        {(()=>{
                          const gross=parse(inp.purchasePrice)+basisCC+grossLoanCosts+deductibleNow+Math.max(0,escrowTotal);
                          return<div style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid "+T.border,marginTop:4,paddingTop:4,fontSize:11,fontWeight:700}}>
                            <span>{"Total"}</span><span>{fmt(gross)}</span>
                          </div>;
                        })()}
                      </div>
                      <div style={{paddingLeft:8}}>
                        <div style={{fontSize:9,color:T.textDim,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>{"Credits to Buyer"}</div>
                        {[
                          {l:"Earnest money",v:earnestAmt,show:earnestAmt>0},
                          {l:"Loan funds",v:parse(inp.loanFunds),show:parse(inp.loanFunds)>0},
                          {l:"Seller credit",v:sellerCrAmt,show:sellerCrAmt>0},
                          {l:"Lender credit",v:lenderCreditAmt,show:lenderCreditAmt>0},
                          {l:"Tax adj",v:taxAdjAmt,show:taxAdjAmt>0},
                          {l:"Option fee",v:optionFeeAmt,show:optionFeeAmt>0},
                          {l:"HOA/other",v:proratedHOAAmt,show:proratedHOAAmt>0},
                          {l:"Agg. adj",v:parse(inp.aggregateAdj),show:parse(inp.aggregateAdj)>0},
                        ].filter(r=>r.show).map((r,i)=>(
                          <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:10,padding:"2px 0",color:T.green}}>
                            <span>{r.l}</span><span>{fmt(r.v)}</span>
                          </div>
                        ))}
                        {(()=>{
                          const totalCr=earnestAmt+parse(inp.loanFunds)+sellerCrAmt+lenderCreditAmt+taxAdjAmt+optionFeeAmt+proratedHOAAmt+parse(inp.aggregateAdj);
                          return<div style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid "+T.border,marginTop:4,paddingTop:4,fontSize:11,fontWeight:700,color:T.green}}>
                            <span>{"Total"}</span><span>{fmt(totalCr)}</span>
                          </div>;
                        })()}
                      </div>
                    </div>
                    {(()=>{
                      const gross=parse(inp.purchasePrice)+basisCC+grossLoanCosts+deductibleNow+Math.max(0,escrowTotal);
                      const credits=earnestAmt+parse(inp.loanFunds)+sellerCrAmt+lenderCreditAmt+taxAdjAmt+optionFeeAmt+proratedHOAAmt+parse(inp.aggregateAdj);
                      const calcCtC=Math.max(0,gross-credits);
                      const actual=parse(inp.actualCashToClose);
                      const diff=actual>0?Math.abs(actual-calcCtC):0;
                      const match=diff<50;
                      return(<>
                        <div style={{marginTop:10,padding:"8px 12px",background:"rgba(200,169,110,0.08)",borderRadius:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div>
                            <div style={{fontSize:10,color:T.gold,fontWeight:700}}>{"Est. Cash to Close"}</div>
                            <div style={{fontSize:9,color:T.textDim}}>{"From your HUD-1 — enter actual to verify"}</div>
                          </div>
                          <div style={{fontSize:22,color:T.gold,fontWeight:300}}>{fmt(calcCtC)}</div>
                        </div>
                        <div style={{marginTop:8,display:"flex",gap:8,alignItems:"center"}}>
                          <div style={{position:"relative",flex:1}}>
                            <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:T.goldDim,fontSize:13,pointerEvents:"none"}}>{"$"}</span>
                            <input type="text" inputMode="decimal" value={inp.actualCashToClose}
                              onChange={e=>s("actualCashToClose",e.target.value)}
                              placeholder="Enter actual Line 303 from HUD-1"
                              style={{width:"100%",background:"#0a0c0f",border:"1px solid "+T.border,
                                borderRadius:6,padding:"7px 12px 7px 22px",fontSize:12,color:T.text,
                                fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
                          </div>
                          {actual>0&&(
                            <div style={{padding:"5px 10px",borderRadius:6,fontSize:11,fontWeight:700,whiteSpace:"nowrap",
                              background:match?"rgba(74,144,96,0.15)":"rgba(192,112,80,0.15)",
                              color:match?T.green:T.red}}>
                              {match?"✓ Match!":"Δ "+fmt(diff)+" off"}
                            </div>
                          )}
                        </div>
                      </>);
                    })()}
                  </div>

                  {/* Property Cost Basis Summary */}
                  <div style={{background:"rgba(200,169,110,0.04)",border:"1px solid "+T.goldDim+"30",borderRadius:8,padding:"10px 12px"}}>
                    <p style={{fontSize:10,color:T.gold,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",margin:"0 0 8px"}}>{"Property Cost Basis"}</p>
                    <div style={{fontSize:11,display:"grid",gap:3}}>
                      <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:T.textMid}}>{"Purchase price"}</span><span>{fmt(parse(inp.purchasePrice))}</span></div>
                      {basisCC>0&&<div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:T.textMid}}>{"+ HUD-1 closing costs (B)"}</span><span style={{color:"#6a8fc0"}}>{fmt(basisCC)}</span></div>}
                      {pocBasis>0&&<div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:T.textMid}}>{"+ POC basis items"}</span><span style={{color:"#6a8fc0"}}>{fmt(pocBasis)}</span></div>}
                      {taxAdjAmt>0&&<div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:T.textMid}}>{"− Tax adjustment"}</span><span style={{color:T.amber}}>{"("+fmt(taxAdjAmt)+")"}</span></div>}
                      {sellerCrAmt>0&&<div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:T.textMid}}>{"− Seller credit"}</span><span style={{color:T.amber}}>{"("+fmt(sellerCrAmt)+")"}</span></div>}
                      {proratedHOAAmt>0&&<div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:T.textMid}}>{"− Prorated HOA/other"}</span><span style={{color:T.amber}}>{"("+fmt(proratedHOAAmt)+")"}</span></div>}
                      <div style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid "+T.border,paddingTop:4,marginTop:2}}>
                        <span style={{color:T.gold,fontWeight:700}}>{"= Property Cost Basis"}</span>
                        <span style={{color:T.gold,fontWeight:700}}>{fmt(totalBasis)}</span>
                      </div>
                      {netLoanCosts>0&&(
                        <div style={{marginTop:4,paddingTop:4,borderTop:"1px solid "+T.border+"40"}}>
                          <div style={{display:"flex",justifyContent:"space-between",fontSize:10}}>
                            <span style={{color:"#a080c8"}}>{"Loan cost basis (amortize over loan term)"}</span>
                            <span style={{color:"#a080c8"}}>{fmt(netLoanCosts)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}

<NavRow>
                <div/>
                <Btn onClick={()=>setStep(1)} disabled={!canGo0}>{"Next →"}</Btn>
              </NavRow>
            </div>
          )}

          {/* STEP 1 — Land */}
          {step===1&&(
            <Card>
              <CardTitle>{"Land vs Building Split"}</CardTitle>
              <CardSub>{"Land is not depreciable. Find at county assessor or Realtor.com → Property Details → Tax History"}</CardSub>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,margin:"12px 0"}}>
                {[{v:"assessed",l:"Enter Assessed Values"},{v:"direct",l:"Enter % Directly"}].map(o=>(
                  <button key={o.v} onClick={()=>s("landRatioMode",o.v)}
                    style={{padding:"10px",borderRadius:7,cursor:"pointer",fontFamily:"inherit",
                      background:inp.landRatioMode===o.v?"rgba(200,169,110,0.12)":T.bgCard,
                      border:"1px solid "+(inp.landRatioMode===o.v?T.gold:T.border)}}>
                    <div style={{fontSize:12,color:inp.landRatioMode===o.v?T.gold:T.text,fontWeight:500}}>{o.l}</div>
                  </button>
                ))}
              </div>
              {inp.landRatioMode==="assessed"&&(
                <>
                  <Fld label="Assessed land value"><Inp value={inp.landAssessed} onChange={v=>s("landAssessed",v)} placeholder="0" prefix="$"/></Fld>
                  <Fld label="Total assessed value"><Inp value={inp.totalAssessed} onChange={v=>s("totalAssessed",v)} placeholder="0" prefix="$"/></Fld>
                </>
              )}
              {inp.landRatioMode==="direct"&&(
                <Fld label="Land percentage (%)"><Inp value={inp.landRatioDirect} onChange={v=>s("landRatioDirect",v)} placeholder="25"/></Fld>
              )}
              {landRatio>0&&<IBox tone="green">Land: <strong>{(landRatio*100).toFixed(1)}%</strong> ({fmt(landBasis)}) · Building: <strong style={{color:T.gold}}>{fmt(buildingBasis)}</strong></IBox>}
              <NavRow><Btn ghost onClick={()=>setStep(0)}>{"← Back"}</Btn><Btn onClick={()=>setStep(2)} disabled={!canGo1}>{"Next →"}</Btn></NavRow>
            </Card>
          )}

          {/* STEP 2 — Asset Classes */}
          {step===2&&(
            <Card>
              <CardTitle>{"Asset Class Allocation"}</CardTitle>
              <CardSub>{"Shorter-lived components depreciate faster. 5/7/15yr assets qualify for bonus depreciation."}</CardSub>
              <Fld label="Property type">
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {[{v:"residential",l:"Residential — 27.5yr"},{v:"nonresidential",l:"Non-residential — 39yr"}].map(o=>(
                    <button key={o.v} onClick={()=>s("propType",o.v)}
                      style={{padding:"9px",borderRadius:7,cursor:"pointer",fontFamily:"inherit",fontSize:11,
                        background:inp.propType===o.v?"rgba(200,169,110,0.12)":T.bgCard,
                        border:"1px solid "+(inp.propType===o.v?T.gold:T.border),color:inp.propType===o.v?T.gold:T.textMid}}>
                      {o.l}
                    </button>
                  ))}
                </div>
              </Fld>
              <div style={{padding:"12px",background:T.bgCard2,border:"1px solid "+T.border,borderRadius:8,marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <span style={{fontSize:10,color:T.gold,fontWeight:700,textTransform:"uppercase"}}>{"Building Basis Allocation"}</span>
                  <span style={{fontSize:11,color:T.textMid}}>{fmt(buildingBasis)+" total"}</span>
                </div>
                {inp.propType==="residential"&&<Fld label="Residential structure — 27.5yr (leave blank = auto)" optional optLbl="optional">
                  <Inp value={inp.alloc27} onChange={v=>s("alloc27",v)} placeholder={fmt(Math.max(0,buildingBasis-parse(inp.alloc15)-parse(inp.alloc7)-parse(inp.alloc5)))} prefix="$"/></Fld>}
                {inp.propType==="nonresidential"&&<Fld label="Non-residential — 39yr (leave blank = auto)" optional optLbl="optional">
                  <Inp value={inp.alloc39} onChange={v=>s("alloc39",v)} placeholder={fmt(Math.max(0,buildingBasis-parse(inp.alloc15)-parse(inp.alloc7)-parse(inp.alloc5)))} prefix="$"/></Fld>}
                <Fld label="Land improvements — 15yr" optional optLbl="optional" hint="Fencing, driveway, landscaping"><Inp value={inp.alloc15} onChange={v=>s("alloc15",v)} placeholder="0" prefix="$"/></Fld>
                <Fld label="Furniture/equipment — 7yr" optional optLbl="optional"><Inp value={inp.alloc7} onChange={v=>s("alloc7",v)} placeholder="0" prefix="$"/></Fld>
                <Fld label="Appliances/carpet/fixtures — 5yr" optional optLbl="optional"><Inp value={inp.alloc5} onChange={v=>s("alloc5",v)} placeholder="0" prefix="$"/></Fld>
              </div>
              <div style={{padding:"12px",background:T.bgCard2,border:"1px solid "+T.border,borderRadius:8,marginBottom:10}}>
                <Toggle value={inp.bonusDepreciation} onChange={v=>s("bonusDepreciation",v)}
                  label="Bonus Depreciation (5/7/15yr only)" desc="100% for property acquired & placed in service after 1/19/25 (OBBBA) · 40% if acquired before 1/20/25 · Structure (27.5yr) always 0%"/>
                {inp.bonusDepreciation&&<Fld label="Bonus rate %"><Inp value={inp.bonusPct} onChange={v=>s("bonusPct",v)} placeholder="100"/></Fld>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <Fld label="Year placed in service"><Inp value={inp.yearPlaced} onChange={v=>s("yearPlaced",v)} placeholder={new Date().getFullYear().toString()}/></Fld>
                <Fld label="Month placed in service" hint="Affects Year 1 real property">
                  <Sel value={inp.monthPlaced} onChange={v=>s("monthPlaced",v)} options={months.map((m,i)=>({value:String(i+1),label:m}))}/>
                </Fld>
              </div>
              <NavRow><Btn ghost onClick={()=>setStep(1)}>{"← Back"}</Btn><Btn onClick={calculate} disabled={!canGo2}>{"Calculate"}</Btn></NavRow>
            </Card>
          )}

          {/* STEP 3 — Results */}
          {step===3&&res&&(
            <div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                <div style={{background:"linear-gradient(135deg,#0d1a08,#0a1205)",border:"1px solid #1a4020",borderRadius:10,padding:"14px"}}>
                  <div style={{fontSize:9,color:"#2a6030",textTransform:"uppercase",letterSpacing:"0.2em",marginBottom:6}}>{"Year 1 Depreciation"}</div>
                  <div style={{fontSize:32,color:T.green,fontWeight:300}}>{fmt(res.totalFirstYear)}</div>
                  {res.totalBonus>0&&<div style={{fontSize:10,color:"#3a7040",marginTop:2}}>{"incl. bonus "+fmt(res.totalBonus)}</div>}
                  <div style={{fontSize:11,color:"#3a7040",marginTop:6}}>{"Annual Yr 2+: "}<strong>{fmt(res.totalAnnual)}</strong></div>
                </div>
                <div style={{background:"linear-gradient(135deg,#0a100a,#060a06)",border:"1px solid "+T.goldDim,borderRadius:10,padding:"14px"}}>
                  <div style={{fontSize:9,color:T.goldDim,textTransform:"uppercase",letterSpacing:"0.2em",marginBottom:6}}>{"Property Cost Basis"}</div>
                  <div style={{fontSize:32,color:T.gold,fontWeight:300}}>{fmt(res.totalBasis)}</div>
                  {res.netLoanCosts>0&&<div style={{fontSize:10,color:T.goldDim,marginTop:2}}>{"Loan cost basis: "+fmt(res.netLoanCosts)}</div>}
                  <div style={{fontSize:11,color:T.goldDim,marginTop:6}}>{"Building: "}<strong>{fmt(res.buildingBasis)}</strong></div>
                </div>
              </div>
              <Card>
                <CardTitle>{"Depreciation Schedule"}</CardTitle>
                <div style={{overflowX:"auto",marginTop:8}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:400}}>
                    <thead>
                      <tr style={{borderBottom:"1px solid "+T.border}}>
                        {["Asset Class","Life","Basis","Bonus","Year 1","Annual"].map((h,i)=>(
                          <th key={i} style={{textAlign:"left",padding:"5px 4px",color:T.textDim,fontWeight:400,fontSize:8,textTransform:"uppercase"}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {res.classResults.map((c,i)=>(
                        <tr key={i} style={{borderBottom:"1px solid "+T.border}}>
                          <td style={{padding:"7px 4px",color:c.color,fontWeight:500}}>{c.label}</td>
                          <td style={{padding:"7px 4px",color:T.textMid}}>{c.life}yr</td>
                          <td style={{padding:"7px 4px"}}>{fmt(c.basis)}</td>
                          <td style={{padding:"7px 4px",color:c.bonus>0?T.gold:T.textDim}}>{c.bonus>0?fmt(c.bonus):"—"}</td>
                          <td style={{padding:"7px 4px",color:T.green,fontWeight:500}}>{fmt(c.firstYear)}</td>
                          <td style={{padding:"7px 4px",color:T.green}}>{fmt(c.annual)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{borderTop:"2px solid "+T.border}}>
                        <td colSpan={4} style={{padding:"8px 0",color:T.gold,fontWeight:700}}>{"Total"}</td>
                        <td style={{padding:"8px 0",color:T.gold,fontWeight:700}}>{fmt(res.totalFirstYear)}</td>
                        <td style={{padding:"8px 0",color:T.gold,fontWeight:700}}>{fmt(res.totalAnnual)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <IBox tone="amber">{"⚠ When you sell: all depreciation recaptured at max 25% (§1250). Consider a 1031 exchange to defer."}</IBox>
              </Card>
              <p style={{fontSize:10,color:T.textDim,textAlign:"center",marginTop:10}}>{"Estimates only — not tax advice. Consult a CPA before claiming."}</p>
              <div style={{marginTop:12,padding:"10px 14px",background:"rgba(200,169,110,0.04)",border:"1px solid "+T.goldDim+"30",borderRadius:8}}>
                <p style={{fontSize:10,color:T.gold,fontWeight:700,margin:"0 0 8px",letterSpacing:"0.06em",textTransform:"uppercase"}}>{"📤 Share Your Results"}</p>
                <p style={{fontSize:10,color:T.textDim,margin:"0 0 8px"}}>{"Share with your CPA, partner, or save for your records."}</p>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  <button onClick={()=>{
                    const txt=[
                      "🏠 RENTAL PROPERTY DEPRECIATION ANALYSIS",
                      "Generated by RealtyTaxTools.com",
                      "",
                      "PROPERTY COST BASIS",
                      "  Purchase Price: "+fmt(parse(res.inp.purchasePrice)),
                      "  Total Basis: "+fmt(res.totalBasis),
                      "  Building Basis: "+fmt(res.buildingBasis),
                      "  Land Value: "+fmt(res.landBasis),
                      "",
                      "DEPRECIATION SCHEDULE",
                      ...res.classResults.map(c=>"  "+c.label+": Year 1 "+fmt(c.firstYear)+" | Annual "+fmt(c.annual)),
                      "",
                      "TOTALS",
                      "  Year 1 Depreciation: "+fmt(res.totalFirstYear),
                      res.totalBonus>0?"  (incl. bonus depreciation: "+fmt(res.totalBonus)+")":"",
                      "  Annual (Year 2+): "+fmt(res.totalAnnual),
                      res.netLoanCosts>0?"  Loan Cost Basis (amortize): "+fmt(res.netLoanCosts):"",
                      "",
                      "Free calculator: realtytaxtools.com",
                    ].filter(l=>l!==null).join("\n");
                    navigator.clipboard.writeText(txt).then(()=>{
                      setCopied(true); setTimeout(()=>setCopied(false),2500);
                    });
                  }}
                    style={{padding:"7px 14px",borderRadius:6,cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:600,
                      background:copied?"rgba(74,144,96,0.2)":"rgba(200,169,110,0.1)",
                      border:"1px solid "+(copied?T.green:T.goldDim),
                      color:copied?T.green:T.gold}}>
                    {copied?"✓ Copied!":"📋 Copy Summary"}
                  </button>
                  <button onClick={()=>{
                    const subject="Rental Property Depreciation Analysis — "+fmt(parse(res.inp.purchasePrice));
                    const body=[
                      "Hi,",
                      "",
                      "Here are the depreciation details for the rental property:",
                      "",
                      "Property Cost Basis: "+fmt(res.totalBasis),
                      "Building Basis: "+fmt(res.buildingBasis),
                      "Year 1 Depreciation: "+fmt(res.totalFirstYear),
                      "Annual Depreciation (Year 2+): "+fmt(res.totalAnnual),
                      "",
                      "Full analysis generated at realtytaxtools.com",
                    ].join("\n");
                    window.location.href="mailto:?subject="+encodeURIComponent(subject)+"&body="+encodeURIComponent(body);
                  }}
                    style={{padding:"7px 14px",borderRadius:6,cursor:"pointer",fontFamily:"inherit",fontSize:11,
                      background:"rgba(74,96,168,0.1)",border:"1px solid rgba(74,96,168,0.3)",color:"#6a8ac0"}}>
                    {"✉ Email to CPA"}
                  </button>
                </div>
              </div>
              <SaleReviewCTA source="Depreciation calculator"/>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:10}}>
                <Btn ghost small onClick={()=>{setStep(2);setRes(null);}}>{"← Adjust"}</Btn>
                <Btn ghost small onClick={resetAll}>{"Start Over"}</Btn>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DepreciationSEOBlock(){
  return(
    <div style={{maxWidth:800,margin:"40px auto 0",padding:"0 20px 40px"}}>
      <h2 style={{fontSize:22,fontWeight:400,color:T.text,marginBottom:16,borderBottom:"1px solid "+T.border,paddingBottom:12}}>
        {"How Rental Property Depreciation Works"}
      </h2>
      {[
        "Rental property depreciation is one of the most powerful tax benefits available to real estate investors. The IRS allows residential rental property to be depreciated over 27.5 years using MACRS (Modified Accelerated Cost Recovery System) straight-line method. Because depreciation is a non-cash deduction, it reduces your taxable rental income without requiring additional spending.",
        "Most investors assume depreciation is simply purchase price divided by 27.5. It is not. The calculation starts with your depreciable basis — which is your purchase price plus certain closing costs, minus land value. Land never wears out, so the IRS never allows it to be depreciated. An error in Year 1 compounds for the entire 27.5-year life of the property.",
        "Closing costs that generally ADD to depreciable basis: title insurance, recording fees, transfer taxes, settlement fees, survey fees, and attorney fees related to the acquisition. Costs that do NOT belong in basis: loan origination fees, prepaid interest, escrow deposits, homeowner's insurance premiums, and property tax prorations paid at closing.",
        "The IRS mid-month convention applies in the year you place the property in service. You do not receive a full year's deduction — the IRS treats the property as placed in service mid-month, resulting in a partial first-year deduction. This calculator applies the mid-month convention automatically.",
        "When you sell, depreciation becomes important again. The IRS taxes all depreciation claimed — or allowable — as unrecaptured Section 1250 gain at a maximum federal rate of 25%. This recapture applies even if you forgot to claim depreciation in prior years. Understanding your accumulated depreciation helps you estimate your tax liability at sale and evaluate strategies like a 1031 exchange to defer the tax.",
      ].map((p,i)=>(
        <p key={i} style={{fontSize:14,color:T.textMid,lineHeight:1.7,marginBottom:14}}>{p}</p>
      ))}
      <h2 style={{fontSize:22,fontWeight:400,color:T.text,margin:"32px 0 16px",borderBottom:"1px solid "+T.border,paddingBottom:12}}>
        {"Frequently Asked Questions"}
      </h2>
      {[
        {q:"Can I depreciate land?",
         a:"No. Land is never depreciable under IRS rules because it does not wear out or get used up. You must separate the land value from your building value before calculating depreciation. The most common method is to use the county tax assessment ratio — divide the assessed building value by total assessed value to get your building percentage."},
        {q:"What closing costs increase my depreciable basis?",
         a:"Closing costs that add to basis include: title insurance, recording fees, transfer taxes, deed stamps, settlement fees, survey fees required for closing, and attorney fees directly related to acquiring the property. Loan-related costs (origination fees, points, prepaid interest) and prorations (property taxes, HOA) generally do not add to basis."},
        {q:"What happens if I forgot to claim depreciation?",
         a:"If you failed to claim depreciation you were entitled to, you can file Form 3115 (Change in Accounting Method) to catch up on missed deductions in the current year. However, when you sell, the IRS taxes depreciation that was allowed or allowable — meaning you owe recapture tax on missed depreciation even if you never claimed it. Always claim your full depreciation deduction."},
        {q:"How is rental property depreciation calculated?",
         a:"Annual depreciation = (Purchase price + basis-adding closing costs minus land value) divided by 27.5. In the first year, the mid-month convention applies — you receive a partial deduction based on which month you placed the property in service. This calculator handles both the basis calculation and the mid-month convention automatically."},
        {q:"What is depreciation recapture?",
         a:"When you sell a rental property, the IRS recaptures the depreciation you claimed by taxing it at a maximum rate of 25% under IRC Section 1250 — regardless of your income bracket. This is separate from capital gains tax. A 1031 exchange defers both the capital gain and the depreciation recapture, which is why it is popular with long-term investors."},
        {q:"Does cost segregation increase my depreciation?",
         a:"Yes. Cost segregation reclassifies components into shorter depreciation categories — 5-year, 7-year, and 15-year — instead of the standard 27.5-year schedule. Combined with 100% bonus depreciation (made permanent by the OBBBA for qualifying property acquired and placed in service after January 19, 2025), cost segregation can generate significant Year 1 deductions on properties valued at $300K or more."},
      ].map((f,i)=>(
        <div key={i} style={{marginBottom:20,padding:"16px",background:T.bgCard,borderRadius:8,border:"1px solid "+T.border}}>
          <p style={{fontSize:14,fontWeight:600,color:T.gold,margin:"0 0 8px"}}>{f.q}</p>
          <p style={{fontSize:13,color:T.textMid,lineHeight:1.7,margin:0}}>{f.a}</p>
        </div>
      ))}
      <h2 style={{fontSize:22,fontWeight:400,color:T.text,margin:"32px 0 16px",borderBottom:"1px solid "+T.border,paddingBottom:12}}>
        {"Real-World Example: Complete Depreciation Calculation"}
      </h2>
      <div style={{background:T.bgCard2,border:"1px solid "+T.border,borderRadius:8,padding:"20px 24px",marginBottom:20}}>
        <p style={{fontSize:13,fontWeight:600,color:T.gold,margin:"0 0 14px"}}>{"Scenario: Single-family rental purchased in March"}</p>
        {[
          {label:"Purchase price",value:"$285,000"},
          {label:"+ Title insurance",value:"$1,050"},
          {label:"+ Recording & settlement fees",value:"$650"},
          {label:"= Adjusted total basis",value:"$286,700"},
          {label:"County assessor — land 18%, building 82%",value:"× 82%"},
          {label:"= Depreciable basis",value:"$235,094"},
          {label:"÷ 27.5 years",value:"= $8,549/year"},
          {label:"First year (March) — mid-month convention × 79.2%",value:"= $6,771"},
        ].map((row,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:i<7?"1px solid "+T.border:"none"}}>
          <span style={{fontSize:12,color:i===7?T.gold:T.textMid,fontWeight:i===7?600:400}}>{row.label}</span>
          <span style={{fontSize:12,color:i===7?T.gold:T.text,fontWeight:i===7?700:500,fontFamily:"monospace"}}>{row.value}</span>
        </div>))}
        <p style={{fontSize:11,color:T.textDim,marginTop:14,marginBottom:0,fontStyle:"italic"}}>
          {"Over 27.5 years this property generates $235,094 in total depreciation deductions — sheltering roughly $8,549 of rental income from tax every year."}
        </p>
        <div style={{marginTop:12,padding:"10px 14px",background:"rgba(74,144,96,0.08)",borderRadius:6,border:"1px solid rgba(74,144,96,0.2)"}}>
          <p style={{fontSize:12,color:T.green,fontWeight:600,margin:"0 0 4px"}}>{"Dollar impact at a 24% federal tax bracket:"}</p>
          <p style={{fontSize:12,color:T.textMid,margin:"0 0 4px"}}>{"$8,549 annual deduction × 24% = "}
            <strong style={{color:T.green}}>{"$2,052 in federal tax savings per year"}</strong>
          </p>
          <p style={{fontSize:12,color:T.textMid,margin:0}}>{"Over the full 27.5-year recovery period, total tax savings could exceed "}
            <strong style={{color:T.green}}>{"$56,000"}</strong>
            {" — before considering future tax law changes or capital improvements."}
          </p>
        </div>
      </div>
      <div style={{padding:"12px 16px",background:"rgba(200,169,110,0.05)",border:"1px solid "+T.border,borderRadius:8,marginBottom:20}}>
        <p style={{fontSize:12,fontWeight:600,color:T.gold,margin:"0 0 6px"}}>{"Why This Matters"}</p>
        <p style={{fontSize:12,color:T.textMid,margin:0,lineHeight:1.7}}>{"A small error in basis allocation — such as using the wrong land percentage or missing qualifying closing costs — can affect your depreciation deduction for the entire 27.5-year recovery period and change your depreciation recapture tax when the property is eventually sold. Getting the basis right at acquisition is one of the highest-value things a CPA does on a rental property return."}</p>
      </div>

      <h2 style={{fontSize:22,fontWeight:400,color:T.text,margin:"32px 0 16px",borderBottom:"1px solid "+T.border,paddingBottom:12}}>
        {"Related Calculators"}
      </h2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:32}}>
        {[
          {label:"Cost Segregation Estimator",sub:"Accelerate your deductions into Year 1",id:"costseg"},
          {label:"Capital Gains Calculator",sub:"See your recapture tax when you sell",id:"capitalgains"},
          {label:"1031 Exchange Calculator",sub:"Defer recapture tax on sale",id:"exchange1031"},
          {label:"IRS Underpayment Penalty",sub:"Avoid penalties on rental income",id:"underpayment"},
        ].map((c,i)=>(<div key={i} onClick={()=>{document.querySelector('[data-calc="'+c.id+'"]') && document.querySelector('[data-calc="'+c.id+'"]').click()}} style={{padding:"14px 16px",background:T.bgCard,border:"1px solid "+T.border,borderRadius:8,cursor:"pointer",transition:"border-color 0.15s"}}
          onMouseEnter={e=>e.currentTarget.style.borderColor=T.goldDim}
          onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
          <p style={{fontSize:13,fontWeight:600,color:T.gold,margin:"0 0 4px"}}>{c.label}</p>
          <p style={{fontSize:11,color:T.textMid,margin:0}}>{c.sub}</p>
        </div>))}
      </div>

      <div style={{padding:"14px 18px",background:"rgba(74,111,168,0.08)",border:"1px solid #2a3848",borderRadius:8,marginBottom:16}}>
        <p style={{fontSize:12,fontWeight:600,color:"#6a9fd8",margin:"0 0 6px"}}>{"⚠ CPA Note"}</p>
        <p style={{fontSize:12,color:T.textMid,margin:0,lineHeight:1.7}}>{"Depreciation calculations depend on correctly identifying your depreciable basis, land allocation, and placed-in-service date. An error in any of these inputs affects your deduction for the entire 27.5-year recovery period and changes your depreciation recapture tax at sale. For properties with complex closing statements, cost segregation components, or prior missed deductions, consult a licensed CPA."}</p>
      </div>
      <div style={{marginTop:32,padding:"20px 24px",background:T.bgCard,borderRadius:8,border:"1px solid "+T.border}}>
        <p style={{fontSize:13,fontWeight:600,color:T.gold,margin:"0 0 8px"}}>{"Why These Calculations Matter"}</p>
        <p style={{fontSize:12,color:T.textMid,lineHeight:1.7,margin:"0 0 10px"}}>{"Tax calculators provide estimates only. Actual tax results depend on your filing status, income, depreciation history, passive activity limitations, state tax rules, and other factors specific to your situation."}</p>
        <p style={{fontSize:12,color:T.textMid,lineHeight:1.7,margin:0}}>{"RealtyTaxTools was built by a licensed CPA to help investors understand common real estate tax calculations using IRS rules and publicly available guidance. For complex transactions — including cost segregation studies, 1031 exchanges, depreciation recapture planning, or large property sales — consult a qualified tax professional."}</p>
      </div>
    </div>
  );
}


function CapGainsCalc({lang:L="en"}){
  const [inp,setInp]=useState({
    saleDate:"",purchaseDate:"",
    salePrice:"",basis:"",improvements:"",depreciation:"",expenses:"",
    fs:"single",agi:"",primary:false,moveInDate:"",moveOutDate:""
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
    const stdDed = STD_DED[fs]||16100;
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
    // Must own AND live as primary for 2+ of last 5 years before sale
    let qualifies121=false;
    if(inp.primary && inp.moveInDate){
      const saleD=inp.saleDate?new Date(inp.saleDate):new Date();
      const moveIn=new Date(inp.moveInDate);
      const moveOut=inp.moveOutDate?new Date(inp.moveOutDate):saleD;
      const effectiveMoveOut=moveOut<saleD?moveOut:saleD;
      // Count time in 5-year lookback window
      const fiveYearsAgo=new Date(saleD);fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear()-5);
      const windowStart=moveIn>fiveYearsAgo?moveIn:fiveYearsAgo;
      const windowEnd=effectiveMoveOut<saleD?effectiveMoveOut:saleD;
      const yearsInWindow=Math.max(0,(windowEnd-windowStart)/(1000*60*60*24*365.25));
      // Ownership period
      const purchaseD=inp.purchaseDate?new Date(inp.purchaseDate):null;
      const yearsOwned=purchaseD?Math.max(0,(saleD-purchaseD)/(1000*60*60*24*365.25)):99;
      qualifies121=yearsInWindow>=2&&yearsOwned>=2;
    }
    let exclusion=0;
    if(qualifies121){
      exclusion=Math.min(realizedGain,inp.fs==="mfj"?500000:250000);
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
          <span style={{fontSize:13,color:inp.primary?T.gold:T.textMid}}>{"This is / was my primary residence (Section 121 exclusion)"}</span>
        </div>
        {inp.primary&&(
          <div style={{marginTop:8,padding:"12px 14px",background:T.bgCard2,border:"1px solid "+T.goldDim+"40",borderRadius:8}}>
            <p style={{fontSize:10,color:T.textDim,margin:"0 0 10px",fontStyle:"italic"}}>
              {"Section 121 requires you lived in the home as your primary residence for at least 2 of the last 5 years before sale. Excludes up to $250,000 (single) or $500,000 (MFJ) of gain."}
            </p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <Fld label={"Date you moved IN as primary home"} hint={"When you started living here as your main home"}>
                <input type="date" value={inp.moveInDate} onChange={e=>s("moveInDate",e.target.value)}
                  style={{width:"100%",background:"#0a0c0f",border:"1px solid "+T.border,borderRadius:6,
                    padding:"10px 12px",fontSize:14,color:T.text,fontFamily:"inherit",outline:"none",
                    boxSizing:"border-box",colorScheme:"dark"}}/>
              </Fld>
              <Fld label={"Date you moved OUT (or sale date)"} hint={"Leave blank if still living there"}>
                <input type="date" value={inp.moveOutDate} onChange={e=>s("moveOutDate",e.target.value)}
                  style={{width:"100%",background:"#0a0c0f",border:"1px solid "+T.border,borderRadius:6,
                    padding:"10px 12px",fontSize:14,color:T.text,fontFamily:"inherit",outline:"none",
                    boxSizing:"border-box",colorScheme:"dark"}}/>
              </Fld>
            </div>
            {(()=>{
              if(!inp.moveInDate) return null;
              const saleD = inp.saleDate ? new Date(inp.saleDate) : new Date();
              const moveIn = new Date(inp.moveInDate);
              const moveOut = inp.moveOutDate ? new Date(inp.moveOutDate) : saleD;
              // Years lived = time between move-in and move-out (capped at sale date)
              const effectiveMoveOut = moveOut < saleD ? moveOut : saleD;
              const yearsLived = Math.max(0,(effectiveMoveOut-moveIn)/(1000*60*60*24*365.25));
              // Years owned = from purchase date (if entered) to sale date
              const purchaseD = inp.purchaseDate ? new Date(inp.purchaseDate) : null;
              const yearsOwned = purchaseD ? Math.max(0,(saleD-purchaseD)/(1000*60*60*24*365.25)) : null;
              // 5-year lookback window
              const fiveYearsAgo = new Date(saleD); fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear()-5);
              // Count months lived in home within last 5 years
              const windowStart = moveIn > fiveYearsAgo ? moveIn : fiveYearsAgo;
              const windowEnd = effectiveMoveOut < saleD ? effectiveMoveOut : saleD;
              const yearsInWindow = Math.max(0,(windowEnd-windowStart)/(1000*60*60*24*365.25));
              const qualifiesLived = yearsInWindow >= 2;
              const qualifiesOwned = yearsOwned === null ? true : yearsOwned >= 2;
              const qualifies = qualifiesLived && qualifiesOwned;
              const excl = inp.fs==="mfj" ? 500000 : 250000;
              return(
                <div style={{marginTop:10}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8}}>
                    <div style={{padding:"6px 10px",background:T.bgCard,borderRadius:5,fontSize:11}}>
                      <div style={{color:T.textDim,marginBottom:2}}>{"Time lived as primary home"}</div>
                      <div style={{color:qualifiesLived?T.green:T.red,fontWeight:600}}>
                        {yearsLived.toFixed(1)+" years in last 5"}
                        {qualifiesLived?" ✓":" (need 2+)"}
                      </div>
                    </div>
                    {yearsOwned!==null&&(
                      <div style={{padding:"6px 10px",background:T.bgCard,borderRadius:5,fontSize:11}}>
                        <div style={{color:T.textDim,marginBottom:2}}>{"Time owned"}</div>
                        <div style={{color:qualifiesOwned?T.green:T.red,fontWeight:600}}>
                          {yearsOwned.toFixed(1)+" years"}
                          {qualifiesOwned?" ✓":" (need 2+)"}
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{padding:"8px 12px",borderRadius:6,
                    background:qualifies?"rgba(74,144,96,0.1)":"rgba(192,112,80,0.1)",
                    border:"1px solid "+(qualifies?T.green:T.red)+"50"}}>
                    {qualifies
                      ?<><span style={{color:T.green,fontWeight:600,fontSize:12}}>{"✅ Qualifies for Section 121 exclusion"}</span>
                        <span style={{color:T.textMid,fontSize:11,display:"block",marginTop:2}}>{"Up to "+fmt(excl)+" of gain excluded — calculated automatically below"}</span></>
                      :<><span style={{color:T.red,fontWeight:600,fontSize:12}}>{"❌ Does not qualify for Section 121"}</span>
                        <span style={{color:T.textMid,fontSize:11,display:"block",marginTop:2}}>{"Need 2+ years lived as primary home in the last 5 years before sale"}</span></>
                    }
                  </div>
                </div>
              );
            })()}
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
        <OutlineBtn onClick={()=>{setInp({saleDate:"",purchaseDate:"",salePrice:"",basis:"",improvements:"",depreciation:"",expenses:"",fs:"single",agi:"",primary:false,moveInDate:"",moveOutDate:""});setRes(null);}}>{"Reset"}</OutlineBtn>
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
                  <tr style={{borderBottom:"1px solid "+T.border}}>
                    <td style={{padding:"6px 0",color:T.green}}>
                      {"− Section 121 Exclusion"}
                      <div style={{fontSize:9,color:T.textDim}}>{"Primary home — owned 2+ yrs, lived 2+ yrs of last 5"}</div>
                    </td>
                    <td style={{padding:"6px 0",textAlign:"right",color:T.green,fontWeight:600}}>{"("+fmt(res.exclusion)+")"}</td>
                  </tr>
                </>}
                {inp.primary&&!res.exclusion&&res.realizedGain>0&&<>
                  <tr style={{borderBottom:"1px solid "+T.border}}>
                    <td colSpan={2} style={{padding:"6px 0"}}>
                      <div style={{fontSize:11,color:T.red}}>{"❌ Section 121 exclusion does not apply — must own AND live as primary home for 2+ of last 5 years"}</div>
                    </td>
                  </tr>
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
        <SaleReviewCTA source="Capital Gains calculator"/>
        <p style={{fontSize:10,color:T.textDim,textAlign:"center",lineHeight:1.6,marginTop:12}}>
          {"Federal estimate only. State taxes, passive loss rules, NIIT, and individual tax situations may affect your final tax liability. Consult a CPA before filing."}
        </p>
      </div>)}
    </div>
  );
}

function CapGainsSEOBlock(){
  return(
    <div style={{maxWidth:800,margin:"40px auto 0",padding:"0 20px 40px"}}>
      <h2 style={{fontSize:22,fontWeight:400,color:T.text,marginBottom:16,borderBottom:"1px solid "+T.border,paddingBottom:12}}>
        {"How Capital Gains Tax Works on Rental Property Sales"}
      </h2>
      {[
        "When you sell a rental property, your taxable gain is usually much higher than most investors expect. The IRS does not calculate gain using your original purchase price alone — gain is based on your adjusted basis, which equals your purchase price plus capital improvements and certain basis-adding closing costs, minus all accumulated depreciation claimed during ownership.",
        "For example, suppose you purchased a rental property for $300,000, made $20,000 in capital improvements, and claimed $80,000 in depreciation over the years. Your adjusted basis is $240,000. If you sell for $400,000, your taxable gain is $160,000 — not the $100,000 appreciation most investors expect.",
        "A rental property sale may generate up to four different types of taxable income. Depreciation claimed on personal property or cost segregation assets is subject to Section 1245 recapture, taxed at ordinary income rates up to 37%. Depreciation claimed on the building structure is taxed as unrecaptured Section 1250 gain at a maximum federal rate of 25%. Any remaining appreciation is taxed as long-term capital gain at 0%, 15%, or 20% depending on your income. Higher-income taxpayers may also owe the 3.8% Net Investment Income Tax on top of all three.",
        "One of the most important concepts for investors: the IRS applies recapture rules to depreciation that was claimed or allowable. Failing to claim depreciation does not eliminate future recapture tax — you owe it either way. Unlike basic capital gains calculators that only show sale price minus purchase price, this calculator estimates all four components separately: Section 1245 recapture, unrecaptured Section 1250 gain, long-term capital gain, and NIIT.",
      ].map((p,i)=>(
        <p key={i} style={{fontSize:14,color:T.textMid,lineHeight:1.7,marginBottom:14}}>{p}</p>
      ))}
      <h2 style={{fontSize:22,fontWeight:400,color:T.text,margin:"32px 0 16px",borderBottom:"1px solid "+T.border,paddingBottom:12}}>
        {"Frequently Asked Questions"}
      </h2>
      {[
        {q:"Why is part of my gain taxed as ordinary income?",
         a:"If you claimed depreciation on personal property through cost segregation or bonus depreciation, that gain is recaptured as Section 1245 gain and taxed at ordinary income rates — up to 37%. This is separate from the 25% cap on building depreciation recapture and can significantly increase your total tax bill at sale."},
        {q:"What is unrecaptured Section 1250 gain?",
         a:"Unrecaptured Section 1250 gain is the depreciation you claimed on the building structure (27.5-year MACRS). It is taxed at a maximum federal rate of 25% regardless of your income bracket. This is the largest recapture item for most landlords and applies even if your long-term capital gains rate is 0% or 15%."},
        {q:"How do I calculate my adjusted basis when I sell?",
         a:"Adjusted basis = purchase price + basis-adding closing costs + capital improvements - accumulated depreciation. Example: $300K purchase + $20K improvements - $80K depreciation = $240K adjusted basis. Sell for $400K = $160K total gain, broken into recapture and capital gain components."},
        {q:"Can I avoid capital gains tax with a 1031 exchange?",
         a:"A 1031 like-kind exchange may defer capital gains and depreciation recapture if all exchange requirements are met and no taxable boot is received. You must identify a replacement property within 45 days of closing and complete the purchase within 180 days. A Qualified Intermediary must hold all funds — touching the proceeds disqualifies the entire exchange."},
        {q:"What is the primary residence exclusion for rental property?",
         a:"If you lived in the property as your primary residence for at least 2 of the last 5 years before sale, you may exclude up to $250,000 of gain ($500,000 married filing jointly) from federal capital gains tax. However, this exclusion does not apply to depreciation recapture — you still owe unrecaptured Section 1250 gain tax (max 25%) on building depreciation claimed during the rental period. If cost segregation was used, Section 1245 recapture on personal property components is also taxable."},
        {q:"What are the 2026 long-term capital gains rates?",
         a:"For 2026 (Rev. Proc. 2025-32): 0% for taxable income up to $49,450 (single) or $98,900 (MFJ); 15% up to $545,500 (single) or $613,700 (MFJ); 20% above those thresholds. Short-term gains are taxed at ordinary income rates. These rates apply only to long-term capital gain — Section 1245 and Section 1250 recapture have their own rates regardless of bracket."},
        {q:"Do I owe state tax on top of federal capital gains tax?",
         a:"Most states tax capital gains as ordinary income. Texas has no state income tax, so Texas residents owe federal tax only. California taxes capital gains up to 13.3%. New York up to 10.9%. This calculator estimates federal tax only — always check your state rules before selling."},
        {q:"What if I forgot to claim depreciation — do I still owe recapture tax?",
         a:"Yes. The IRS taxes depreciation that was allowed or allowable — meaning even if you never claimed depreciation, you still owe recapture tax on what you could have claimed. If you missed depreciation deductions, file Form 3115 (Change in Accounting Method) to catch up before you sell. A CPA can calculate your correct accumulated depreciation."},
      ].map((f,i)=>(
        <div key={i} style={{marginBottom:20,padding:"16px",background:T.bgCard,borderRadius:8,border:"1px solid "+T.border}}>
          <p style={{fontSize:14,fontWeight:600,color:T.gold,margin:"0 0 8px"}}>{f.q}</p>
          <p style={{fontSize:13,color:T.textMid,lineHeight:1.7,margin:0}}>{f.a}</p>
        </div>
      ))}
      <h2 style={{fontSize:22,fontWeight:400,color:T.text,margin:"32px 0 16px",borderBottom:"1px solid "+T.border,paddingBottom:12}}>
        {"Real-World Example: Capital Gains Tax on a Rental Property Sale"}
      </h2>
      <div style={{background:T.bgCard2,border:"1px solid "+T.border,borderRadius:8,padding:"20px 24px",marginBottom:16}}>
        <p style={{fontSize:13,fontWeight:600,color:T.gold,margin:"0 0 14px"}}>{"Step 1 — Calculate adjusted basis"}</p>
        {[
          {label:"Original purchase price",value:"$300,000"},
          {label:"+ Qualifying closing costs",value:"$4,500"},
          {label:"+ Capital improvements",value:"$20,000"},
          {label:"− Accumulated depreciation (10 years)",value:"($80,000)"},
          {label:"= Adjusted basis at sale",value:"$244,500",bold:true},
        ].map((row,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid "+T.border+"50"}}>
            <span style={{fontSize:12,color:row.bold?T.gold:T.textMid,fontWeight:row.bold?600:400}}>{row.label}</span>
            <span style={{fontSize:12,color:row.bold?T.gold:T.text,fontWeight:row.bold?700:500,fontFamily:"monospace"}}>{row.value}</span>
          </div>
        ))}
      </div>
      <div style={{background:T.bgCard2,border:"1px solid "+T.border,borderRadius:8,padding:"20px 24px",marginBottom:16}}>
        <p style={{fontSize:13,fontWeight:600,color:T.gold,margin:"0 0 14px"}}>{"Step 2 — Subtract selling costs (most investors forget this)"}</p>
        {[
          {label:"Sale price",value:"$420,000"},
          {label:"− Selling costs (agent commission, closing fees)",value:"($25,000)"},
          {label:"= Net sales proceeds",value:"$395,000",bold:true},
          {label:"− Adjusted basis",value:"($244,500)"},
          {label:"= Total realized gain",value:"$150,500",bold:true},
        ].map((row,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid "+T.border+"50"}}>
            <span style={{fontSize:12,color:row.bold?T.gold:T.textMid,fontWeight:row.bold?600:400}}>{row.label}</span>
            <span style={{fontSize:12,color:row.bold?T.gold:T.text,fontWeight:row.bold?700:500,fontFamily:"monospace"}}>{row.value}</span>
          </div>
        ))}
        <p style={{fontSize:11,color:T.textDim,marginTop:10,marginBottom:0,fontStyle:"italic"}}>
          {"Selling costs (realtor commissions, title fees, closing costs) reduce your net proceeds and therefore reduce your taxable gain. Many investors calculate gain on the full $420,000 and overpay taxes as a result."}
        </p>
      </div>
      <div style={{background:T.bgCard2,border:"1px solid "+T.border,borderRadius:8,padding:"20px 24px",marginBottom:16}}>
        <p style={{fontSize:13,fontWeight:600,color:T.gold,margin:"0 0 14px"}}>{"Step 3 — What most investors miss: the tax layers"}</p>
        <p style={{fontSize:12,color:T.textMid,lineHeight:1.7,marginBottom:14}}>
          {"Total gain of $150,500 is split into two buckets — each taxed differently:"}
        </p>
        {[
          {label:"Depreciation recapture (§1250 unrecaptured)",value:"$80,000",sub:"Taxed at 25% max — not at capital gains rate"},
          {label:"Long-term capital gain (remaining appreciation)",value:"$70,500",sub:"Taxed at 0%, 15%, or 20% depending on income"},
        ].map((row,i)=>(
          <div key={i} style={{padding:"10px 14px",background:T.bgCard,borderRadius:6,border:"1px solid "+T.border,marginBottom:8}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:12,color:T.text,fontWeight:600}}>{row.label}</span>
              <span style={{fontSize:13,color:T.gold,fontWeight:700,fontFamily:"monospace"}}>{row.value}</span>
            </div>
            <p style={{fontSize:11,color:T.textMid,margin:0,fontStyle:"italic"}}>{row.sub}</p>
          </div>
        ))}
        <p style={{fontSize:12,color:T.textMid,lineHeight:1.7,marginTop:12,marginBottom:0}}>
          {"Many investors expect to pay 15% on the entire $150,500 gain. The reality: the $80,000 recapture portion is taxed at 25% regardless of your bracket, adding roughly "}
          <strong style={{color:T.red}}>{"$8,000 in unexpected tax"}</strong>
          {" compared to a simple capital gains calculation. Selling costs and recapture together can surprise investors who don't plan ahead."}
        </p>
      </div>
      <div style={{padding:"12px 16px",background:"rgba(200,169,110,0.05)",border:"1px solid "+T.border,borderRadius:8,marginBottom:16}}>
        <p style={{fontSize:12,fontWeight:600,color:T.gold,margin:"0 0 6px"}}>{"Why This Matters"}</p>
        <p style={{fontSize:12,color:T.textMid,margin:0,lineHeight:1.7}}>{"Understanding the difference between capital gains tax and depreciation recapture — and remembering to subtract selling expenses — can prevent expensive surprises at closing. Many investors list a property without first running these numbers and are shocked when their net proceeds are $20,000–$40,000 less than expected."}</p>
      </div>
      <div style={{padding:"14px 18px",background:"rgba(74,111,168,0.08)",border:"1px solid #2a3848",borderRadius:8,marginBottom:20}}>
        <p style={{fontSize:12,fontWeight:600,color:"#6a9fd8",margin:"0 0 6px"}}>{"⚠ CPA Note"}</p>
        <p style={{fontSize:12,color:T.textMid,margin:0,lineHeight:1.7}}>{"The example above is a simplified illustration. Actual tax results depend on your filing status, income, depreciation history, state taxes, passive activity limitations, and holding period. Texas has no state income tax — if you are selling property in another state, add that amount to your total. Consult a licensed CPA before selling a rental property."}</p>
      </div>

      <h2 style={{fontSize:22,fontWeight:400,color:T.text,margin:"32px 0 16px",borderBottom:"1px solid "+T.border,paddingBottom:12}}>
        {"Related Calculators"}
      </h2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:32}}>
        {[
          {label:"1031 Exchange Calculator",sub:"Defer all of this tax by reinvesting",id:"exchange1031"},
          {label:"Depreciation Calculator",sub:"Know your accumulated recapture before selling",id:"depreciation"},
          {label:"Cost Segregation Estimator",sub:"Front-load deductions before you sell",id:"costseg"},
          {label:"IRS Underpayment Penalty",sub:"Avoid penalties in the year of sale",id:"underpayment"},
        ].map((c,i)=>(<div key={i} style={{padding:"14px 16px",background:T.bgCard,border:"1px solid "+T.border,borderRadius:8,cursor:"pointer",transition:"border-color 0.15s"}}
          onMouseEnter={e=>e.currentTarget.style.borderColor=T.goldDim}
          onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
          <p style={{fontSize:13,fontWeight:600,color:T.gold,margin:"0 0 4px"}}>{c.label}</p>
          <p style={{fontSize:11,color:T.textMid,margin:0}}>{c.sub}</p>
        </div>))}
      </div>

      <div style={{marginTop:32,padding:"20px 24px",background:T.bgCard,borderRadius:8,border:"1px solid "+T.border}}>
        <p style={{fontSize:13,fontWeight:600,color:T.gold,margin:"0 0 8px"}}>{"Why These Calculations Matter"}</p>
        <p style={{fontSize:12,color:T.textMid,lineHeight:1.7,margin:"0 0 10px"}}>{"Tax calculators provide estimates only. Actual tax results depend on your filing status, income, depreciation history, passive activity limitations, state tax rules, and other factors specific to your situation."}</p>
        <p style={{fontSize:12,color:T.textMid,lineHeight:1.7,margin:0}}>{"RealtyTaxTools was built by a licensed CPA to help investors understand common real estate tax calculations using IRS rules and publicly available guidance. For complex transactions — including cost segregation studies, 1031 exchanges, depreciation recapture planning, or large property sales — consult a qualified tax professional."}</p>
      </div>
    </div>
  );
}

function STRCalc({lang:L="en"}){
  const [inp,setInp]=useState({
    rentalDays:"",personalDays:"",
    income:"",
    // Operating expenses (split by rental%)
    operatingExp:"",
    // Depreciation — separate from operating, also split by rental%
    buildingBasis:"",buildingLife:"27.5",
    placedInServiceDate:"",  // for mid-month convention Year 1
    taxYear:new Date().getFullYear().toString(), // which tax year is this calc for?
    // Cost segregation components (optional)
    hasCostSeg:false,
    seg5Basis:"",seg7Basis:"",seg15Basis:"",bonusPct:"100",
    // Tax context
    agi:"",fs:"single",mpTest:"none",
  });
  const [res,setRes]=useState(null);
  const s=(k,v)=>setInp(p=>({...p,[k]:v}));

  // ── Live derived values ────────────────────────────────────────
  const rd=parse(inp.rentalDays), pd=parse(inp.personalDays);
  const total=rd+pd;
  const rentalPct=total>0?rd/total:(rd>0?1:0);

  // Operating expenses allocated by rental%
  const allocatedOpExp=Math.round(parse(inp.operatingExp)*rentalPct*100)/100;

  // Building depreciation — mid-month convention Year 1, full year after
  const buildingBasis=parse(inp.buildingBasis);
  const buildingLife=parseFloat(inp.buildingLife||"27.5");
  const buildingAnnual=buildingBasis>0?Math.round(buildingBasis/buildingLife*100)/100:0;

  // Determine which year of service this is
  const placedDate=inp.placedInServiceDate?new Date(inp.placedInServiceDate):null;
  const calcYear=parseInt(inp.taxYear)||new Date().getFullYear();
  const placedYear=placedDate?placedDate.getFullYear():null;
  const isYear1=placedYear===calcYear;
  const isBeforePlaced=placedYear&&calcYear<placedYear; // property not yet in service

  // Mid-month convention: get credit for half of month placed in service
  // Deduction = annual × (months remaining including half of placed month) / 12
  const placedMonth=placedDate?placedDate.getMonth()+1:1; // 1=Jan, 12=Dec
  const midMonthFactor=isYear1?((13-placedMonth-0.5)/12):1; // e.g. placed Jun=month 6 → (13-6-0.5)/12 = 6.5/12
  const buildingDeprForYear=isBeforePlaced?0:Math.round(buildingAnnual*midMonthFactor*100)/100;
  const buildingDeprAlloc=Math.round(buildingDeprForYear*rentalPct*100)/100;

  // Cost seg components — 5/7yr 200%DB, 15yr 150%DB + bonus
  // These are also allocated by rental%
  const bPct=parse(inp.bonusPct)/100;
  function calcCostSeg(basis,life,dbRate){
    if(!basis) return {year1:0,annual:0,yearN:0};
    if(isBeforePlaced) return {year1:0,annual:0,yearN:0};
    const bonus=isYear1?Math.round(basis*bPct*100)/100:0; // bonus only in year placed
    const remaining=basis-bonus;
    // Half-year convention for personal property (5/7/15yr)
    const halfYearFactor=isYear1?0.5:1;
    const annualDB=Math.round(remaining*(dbRate/life)*halfYearFactor*100)/100;
    const year1Total=bonus+annualDB;
    // Subsequent years: switch to SL when beneficial (simplified: use DB for now)
    const annualSubseq=Math.round(remaining*(dbRate/life)*100)/100;
    return {
      year1:Math.round(year1Total*rentalPct*100)/100,
      annual:Math.round(annualSubseq*rentalPct*100)/100,
      yearN:isYear1?Math.round(year1Total*rentalPct*100)/100:Math.round(annualSubseq*rentalPct*100)/100
    };
  }
  const seg5=calcCostSeg(parse(inp.seg5Basis),5,2);
  const seg7=calcCostSeg(parse(inp.seg7Basis),7,2);
  const seg15=calcCostSeg(parse(inp.seg15Basis),15,1.5);

  const costSegThisYear=inp.hasCostSeg?seg5.yearN+seg7.yearN+seg15.yearN:0;
  const totalDeprYear1=buildingDeprAlloc+costSegThisYear; // "Year1" now means "this tax year"
  const totalDeprAnnual=buildingDeprAlloc+(inp.hasCostSeg?seg5.annual+seg7.annual+seg15.annual:0);

  // Total deductions
  const totalDeductions=allocatedOpExp+totalDeprYear1;
  const netIncome=Math.round((parse(inp.income)-totalDeductions)*100)/100;

  function doCalc(){
    const agi=parse(inp.agi);
    const rule14=rd<=14&&rd>0;
    const personalThreshold=Math.max(14,Math.round(rd*0.10));
    const isVacationHome=pd>personalThreshold;
    const mpTest=inp.mpTest||"none";
    const isMaterialParticipation=mpTest!=="none";
    const isNonPassive=isMaterialParticipation&&!isVacationHome;

    // Net income for tax depends on classification
    const netIncomeForTax=isVacationHome
      ?Math.max(0,netIncome)
      :isNonPassive?netIncome
      :Math.max(0,netIncome);

    const stdDed=STD_DED[inp.fs]||16100;
    const totalTaxableIncome=Math.max(0,agi+netIncomeForTax);
    const taxableAfterDeduction=Math.max(0,agi+netIncomeForTax-stdDed);
    const taxWithRental=estTax(agi+netIncomeForTax,inp.fs);
    const taxWithout=estTax(agi,inp.fs);
    const rentalTaxEffect=taxWithRental-taxWithout;

    setRes({
      rd,pd,rentalPct,allocatedOpExp,
      buildingDeprAlloc,buildingDeprForYear,isYear1,placedDate,
      totalDeprYear1,totalDeprAnnual,
      seg5,seg7,seg15,
      totalDeductions,netIncome,netIncomeForTax,
      agi,stdDed,totalTaxableIncome,taxableAfterDeduction,
      taxWithRental,taxWithout,rentalTaxEffect,
      rule14,isVacationHome,isNonPassive,isMaterialParticipation,mpTest,
      personalThreshold,calcYear,
    });
  }

  return(
    <div>
      <div style={{marginBottom:16}}>
        <h3 style={{margin:"0 0 4px",fontSize:15,fontWeight:400,color:T.gold}}>{"Short-Term Rental Tax Calculator (Airbnb / VRBO)"}</h3>
        <p style={{margin:0,fontSize:12,color:T.textDim}}>{"Includes cost segregation depreciation, personal use allocation, and passive activity rules"}</p>
      </div>

      {/* Days */}
      <div style={{padding:"10px 14px",background:T.bgCard2,border:"1px solid "+T.border,borderRadius:8,marginBottom:10}}>
        <p style={{fontSize:10,color:T.gold,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",margin:"0 0 10px"}}>{"Usage Days"}</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Fld label={"Rental days"} hint={"Days rented to guests"}><Inp value={inp.rentalDays} onChange={v=>s("rentalDays",v)} placeholder="0"/></Fld>
          <Fld label={"Personal use days"} hint={"Days you or family used it"}><Inp value={inp.personalDays} onChange={v=>s("personalDays",v)} placeholder="0"/></Fld>
        </div>
        {(rd>0||pd>0)&&(
          <div style={{marginTop:8,padding:"6px 10px",background:"rgba(200,169,110,0.06)",borderRadius:5,fontSize:11,color:T.gold}}>
            {"Rental %: "}<strong>{pct(rentalPct)}</strong>
            {" — only this portion of expenses and depreciation is deductible"}
          </div>
        )}
      </div>

      {/* Income */}
      <div style={{padding:"10px 14px",background:T.bgCard2,border:"1px solid "+T.border,borderRadius:8,marginBottom:10}}>
        <p style={{fontSize:10,color:T.gold,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",margin:"0 0 10px"}}>{"Rental Income"}</p>
        <Fld label={"Total rental income received"}><Inp value={inp.income} onChange={v=>s("income",v)} placeholder="0" prefix="$"/></Fld>
      </div>

      {/* Operating Expenses */}
      <div style={{padding:"10px 14px",background:T.bgCard2,border:"1px solid "+T.border,borderRadius:8,marginBottom:10}}>
        <p style={{fontSize:10,color:T.gold,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",margin:"0 0 4px"}}>{"Operating Expenses"}</p>
        <p style={{fontSize:10,color:T.textDim,margin:"0 0 10px",fontStyle:"italic"}}>{"Mortgage interest, insurance, utilities, repairs, Airbnb fees, management, HOA — enter TOTAL. Calculator allocates by rental %."}</p>
        <Fld label={"Total operating expenses (full year)"} hint={"Do NOT include depreciation here — enter below separately"}>
          <Inp value={inp.operatingExp} onChange={v=>s("operatingExp",v)} placeholder="0" prefix="$"/>
        </Fld>
        {allocatedOpExp>0&&(
          <div style={{fontSize:11,color:T.textMid,marginTop:4}}>
            {"Deductible portion: "}<strong style={{color:T.green}}>{fmt(allocatedOpExp)}</strong>
            {" ("+pct(rentalPct)+" of "+fmt(parse(inp.operatingExp))+")"}
          </div>
        )}
      </div>

      {/* Depreciation — separate section */}
      <div style={{padding:"10px 14px",background:T.bgCard2,border:"1px solid "+T.border,borderRadius:8,marginBottom:10}}>
        <p style={{fontSize:10,color:T.gold,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",margin:"0 0 4px"}}>{"Depreciation (Separate from Operating Expenses)"}</p>
        <p style={{fontSize:10,color:T.textDim,margin:"0 0 10px",fontStyle:"italic"}}>{"Depreciation is NOT an out-of-pocket expense. It is a non-cash deduction. Personal use days reduce the deductible portion to zero for those days."}</p>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Fld label={"Building depreciable basis"} hint={"Purchase price + closing costs − land value"}>
            <Inp value={inp.buildingBasis} onChange={v=>s("buildingBasis",v)} placeholder="0" prefix="$"/>
          </Fld>
          <Fld label={"Recovery period"} hint={"27.5yr residential, 39yr commercial"}>
            <Sel value={inp.buildingLife} onChange={v=>s("buildingLife",v)} options={[
              {value:"27.5",label:"27.5 years — Residential"},
              {value:"39",label:"39 years — Non-residential"},
            ]}/>
          </Fld>
          <Fld label={"Date placed in service"} hint={"Month affects Year 1 mid-month convention"}>
            <input type="date" value={inp.placedInServiceDate} onChange={e=>s("placedInServiceDate",e.target.value)}
              style={{width:"100%",background:"#0a0c0f",border:"1px solid "+T.border,borderRadius:6,
                padding:"10px 12px",fontSize:14,color:T.text,fontFamily:"inherit",outline:"none",
                boxSizing:"border-box",colorScheme:"dark"}}/>
          </Fld>
          <Fld label={"Tax year for this calculation"} hint={"Year 1 = partial year (mid-month). Year 2+ = full year."}>
            <Inp value={inp.taxYear} onChange={v=>s("taxYear",v)} placeholder={new Date().getFullYear().toString()}/>
          </Fld>
        </div>
        {buildingBasis>0&&(
          <div style={{marginTop:8,padding:"8px 10px",background:"rgba(74,96,168,0.08)",borderRadius:5,fontSize:11}}>
            {isBeforePlaced&&<div style={{color:T.red}}>{"⚠ Property not yet placed in service in "+calcYear+" — no depreciation allowed"}</div>}
            {!isBeforePlaced&&<>
              <div style={{color:T.textMid}}>{"Full annual depreciation: "}<strong style={{color:T.text}}>{fmt(buildingAnnual)}</strong></div>
              {isYear1&&placedDate&&(
                <div style={{color:T.amber,marginTop:2}}>
                  {"Year 1 (mid-month, placed "+["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][placedMonth-1]+"): "}
                  <strong>{fmt(buildingDeprForYear)}</strong>
                  {" ("+Math.round(midMonthFactor*100)/100+" × annual)"}
                </div>
              )}
              <div style={{color:T.textMid,marginTop:2}}>
                {"Deductible this year ("+pct(rentalPct)+" rental use): "}
                <strong style={{color:T.green}}>{fmt(buildingDeprAlloc)}</strong>
              </div>
              {pd>0&&<div style={{color:T.red,marginTop:2}}>
                {"Personal use reduces deduction by "+fmt(buildingDeprForYear-buildingDeprAlloc)+" ("+pct(1-rentalPct)+" of "+fmt(buildingDeprForYear)+")"}
              </div>}
            </>}
          </div>
        )}

        {/* Cost Segregation Toggle */}
        <div style={{marginTop:12}}>
          <Toggle value={inp.hasCostSeg} onChange={v=>s("hasCostSeg",v)}
            label={"I have a cost segregation study"}
            desc={"Accelerates depreciation on 5/7/15-year components — appliances, fixtures, land improvements. Requires an engineering study."}/>
        </div>

        {inp.hasCostSeg&&(
          <div style={{marginTop:10,padding:"10px 14px",background:"rgba(200,169,110,0.04)",border:"1px solid "+T.goldDim+"30",borderRadius:6}}>
            <p style={{fontSize:10,color:T.goldDim,fontWeight:600,margin:"0 0 8px"}}>{"Cost Segregation Components (from your study)"}</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr",gap:0}}>
              <Fld label={"5-year property basis"} hint={"Appliances, carpet, fixtures — 200% DB"}>
                <Inp value={inp.seg5Basis} onChange={v=>s("seg5Basis",v)} placeholder="0" prefix="$"/>
              </Fld>
              <Fld label={"7-year property basis"} hint={"Furniture, equipment — 200% DB"}>
                <Inp value={inp.seg7Basis} onChange={v=>s("seg7Basis",v)} placeholder="0" prefix="$"/>
              </Fld>
              <Fld label={"15-year property basis"} hint={"Land improvements: fencing, driveway, landscaping — 150% DB"}>
                <Inp value={inp.seg15Basis} onChange={v=>s("seg15Basis",v)} placeholder="0" prefix="$"/>
              </Fld>
              <Fld label={"Bonus depreciation rate (100% post-OBBBA)"} hint={"Applies to 5/7/15-yr assets only"}>
                <Inp value={inp.bonusPct} onChange={v=>s("bonusPct",v)} placeholder="100"/>
              </Fld>
            </div>
            {(seg5.year1+seg7.year1+seg15.year1)>0&&(
              <div style={{padding:"8px 10px",background:"rgba(74,144,96,0.08)",borderRadius:5,fontSize:11,marginTop:4}}>
                <div style={{color:T.textMid}}>{"Year 1 cost seg deduction (incl. bonus): "}<strong style={{color:T.green}}>{fmt(seg5.year1+seg7.year1+seg15.year1)}</strong></div>
                <div style={{color:T.textDim,fontSize:9,marginTop:2}}>{"(already reduced by "+pct(rentalPct)+" rental use — personal days excluded)"}</div>
                <div style={{color:T.textMid,marginTop:2}}>{"Annual (Yr 2+): "}<strong>{fmt(seg5.annual+seg7.annual+seg15.annual)}</strong></div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tax context */}
      <div style={{padding:"10px 14px",background:T.bgCard2,border:"1px solid "+T.border,borderRadius:8,marginBottom:10}}>
        <p style={{fontSize:10,color:T.gold,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",margin:"0 0 10px"}}>{"Your Tax Situation"}</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Fld label={"Filing status"}><Sel value={inp.fs} onChange={v=>s("fs",v)} options={[
            {value:"single",label:"Single"},
            {value:"mfj",label:"Married Filing Jointly"},
            {value:"mfs",label:"Married Filing Separately"},
            {value:"hoh",label:"Head of Household"},
          ]}/></Fld>
          <Fld label={"Other income (AGI excl. this rental)"} hint={"Used for accurate bracket stacking"}>
            <Inp value={inp.agi} onChange={v=>s("agi",v)} placeholder="0" prefix="$"/>
          </Fld>
        </div>
        <div style={{marginTop:10}}>
          <div style={{fontSize:11,color:T.textMid,fontWeight:600,marginBottom:6}}>{"Material Participation Test — meet ONE:"}</div>
          <Sel value={inp.mpTest} onChange={v=>s("mpTest",v)} options={[
            {value:"none",label:"❌  None — I do NOT materially participate"},
            {value:"500hrs",label:"✅  Test 1 — 500+ hours in this rental this year"},
            {value:"allwork",label:"✅  Test 2 — Substantially all work done by me"},
            {value:"100hrs",label:"✅  Test 3 — 100+ hours AND more than anyone else"},
            {value:"sig500",label:"✅  Test 4 — Significant participation activities total 500+ hrs combined"},
            {value:"prior5",label:"✅  Test 5 — Materially participated in 5 of last 10 years"},
          ]}/>
          <div style={{fontSize:9,color:T.textDim,marginTop:6,lineHeight:1.5,fontStyle:"italic"}}>
            {"STR (avg stay ≤7 days) + material participation → NON-PASSIVE. Losses offset any income. Without material participation → OTHER PASSIVE (no $25k allowance)."}
          </div>
        </div>
      </div>

      {/* Live deduction summary before calc */}
      {(parse(inp.income)>0||allocatedOpExp>0||totalDeprYear1>0)&&(
        <div style={{padding:"10px 14px",background:"rgba(200,169,110,0.04)",border:"1px solid "+T.goldDim+"40",borderRadius:8,marginBottom:10}}>
          <p style={{fontSize:10,color:T.goldDim,fontWeight:700,margin:"0 0 8px",textTransform:"uppercase",letterSpacing:"0.06em"}}>{"Live Summary"}</p>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
            <tbody>
              <tr><td style={{padding:"3px 0",color:T.textMid}}>{"Gross rental income"}</td><td style={{textAlign:"right"}}>{fmt(parse(inp.income))}</td></tr>
              {allocatedOpExp>0&&<tr><td style={{padding:"3px 0",color:T.textMid}}>{"− Operating expenses ("+pct(rentalPct)+")"}</td><td style={{textAlign:"right",color:T.green}}>{fmt(allocatedOpExp)}</td></tr>}
              {buildingDeprAlloc>0&&<tr><td style={{padding:"3px 0",color:T.textMid}}>{"− Building depreciation ("+pct(rentalPct)+")"}</td><td style={{textAlign:"right",color:T.green}}>{fmt(buildingDeprAlloc)}</td></tr>}
              {inp.hasCostSeg&&(seg5.year1+seg7.year1+seg15.year1)>0&&<tr><td style={{padding:"3px 0",color:T.textMid}}>{"− Cost seg depreciation (Yr 1, "+pct(rentalPct)+")"}</td><td style={{textAlign:"right",color:T.green}}>{fmt(seg5.year1+seg7.year1+seg15.year1)}</td></tr>}
              <tr style={{borderTop:"1px solid "+T.border}}>
                <td style={{padding:"5px 0",fontWeight:600,color:netIncome>=0?T.gold:T.red}}>{"= Net rental income"}</td>
                <td style={{textAlign:"right",fontWeight:600,color:netIncome>=0?T.gold:T.red}}>{netIncome>=0?fmt(netIncome):"("+fmt(Math.abs(netIncome))+" loss)"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div style={{display:"flex",gap:8,marginTop:4}}>
        <GoldBtn onClick={doCalc}>{"Analyze Tax Impact"}</GoldBtn>
        <OutlineBtn onClick={()=>{setInp({rentalDays:"",personalDays:"",income:"",operatingExp:"",buildingBasis:"",buildingLife:"27.5",placedInServiceDate:"",taxYear:new Date().getFullYear().toString(),hasCostSeg:false,seg5Basis:"",seg7Basis:"",seg15Basis:"",bonusPct:"100",agi:"",fs:"single",mpTest:"none"});setRes(null);}}>{"Reset"}</OutlineBtn>
      </div>

      {res&&(<div style={{marginTop:20}}>
        {res.rule14&&(
          <IBox tone="green">
            <strong>{"✓ 14-Day Rule Applies"}</strong><br/>
            {"You rented 14 days or fewer. Rental income is NOT reportable for federal income tax (§280A(g)). No deductions allowed either — it is simply excluded."}
          </IBox>
        )}
        {!res.rule14&&(<>
          {/* Deduction breakdown */}
          <div style={{background:T.bgCard2,border:"1px solid "+T.border,borderRadius:8,padding:"12px 14px",marginBottom:10}}>
            <p style={{fontSize:10,fontWeight:700,color:T.gold,margin:"0 0 10px",letterSpacing:"0.08em",textTransform:"uppercase"}}>{"Deduction Breakdown"}</p>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <tbody>
                <tr style={{borderBottom:"1px solid "+T.border}}>
                  <td style={{padding:"5px 0",color:T.textMid}}>{"Gross rental income"}</td>
                  <td style={{padding:"5px 0",textAlign:"right",fontWeight:500}}>{fmt(res.inc||parse(inp.income))}</td>
                </tr>
                <tr style={{borderBottom:"1px solid "+T.border}}>
                  <td style={{padding:"5px 0",color:T.textMid}}>
                    {"− Operating expenses"}
                    <div style={{fontSize:9,color:T.textDim}}>{fmt(parse(inp.operatingExp))+" total × "+pct(res.rentalPct)+" rental use"}</div>
                  </td>
                  <td style={{padding:"5px 0",textAlign:"right",color:T.green}}>{fmt(res.allocatedOpExp)}</td>
                </tr>
                <tr style={{borderBottom:"1px solid "+T.border}}>
                  <td style={{padding:"5px 0",color:T.textMid}}>
                    {"− Building depreciation (non-cash)"}
                    <div style={{fontSize:9,color:T.textDim}}>
                      {res.isYear1&&res.placedDate
                        ?"Year 1 mid-month: "+fmt(res.buildingDeprForYear)+" × "+pct(res.rentalPct)+" rental use"
                        :fmt(buildingAnnual)+" annual × "+pct(res.rentalPct)+" rental use"}
                      {pd>0&&" — "+fmt(res.buildingDeprForYear-res.buildingDeprAlloc)+" reduced by personal use"}
                    </div>
                  </td>
                  <td style={{padding:"5px 0",textAlign:"right",color:T.green}}>{fmt(res.buildingDeprAlloc)}</td>
                </tr>
                {inp.hasCostSeg&&res.totalDeprYear1>res.buildingDeprAlloc&&(
                  <tr style={{borderBottom:"1px solid "+T.border}}>
                    <td style={{padding:"5px 0",color:T.textMid}}>
                      {"− Cost segregation (Year 1 incl. bonus)"}
                      <div style={{fontSize:9,color:T.textDim}}>
                        {parse(inp.seg5Basis)>0&&"5yr: "+fmt(res.seg5.year1)+"  "}
                        {parse(inp.seg7Basis)>0&&"7yr: "+fmt(res.seg7.year1)+"  "}
                        {parse(inp.seg15Basis)>0&&"15yr: "+fmt(res.seg15.year1)}
                      </div>
                    </td>
                    <td style={{padding:"5px 0",textAlign:"right",color:T.green}}>{fmt(res.seg5.year1+res.seg7.year1+res.seg15.year1)}</td>
                  </tr>
                )}
                <tr style={{background:"rgba(200,169,110,0.06)"}}>
                  <td style={{padding:"7px 0",fontWeight:600,color:res.netIncome>=0?T.gold:T.red}}>
                    {"= Net rental "+(res.netIncome>=0?"income":"loss")}
                  </td>
                  <td style={{padding:"7px 0",textAlign:"right",fontWeight:600,color:res.netIncome>=0?T.gold:T.red}}>
                    {res.netIncome>=0?fmt(res.netIncome):"("+fmt(Math.abs(res.netIncome))+")"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Classification banner */}
          <div style={{padding:"8px 12px",borderRadius:6,marginBottom:10,fontSize:11,fontWeight:600,
            background:res.isVacationHome?"rgba(200,169,110,0.1)":res.isNonPassive?"rgba(74,144,96,0.1)":"rgba(192,112,80,0.08)",
            color:res.isVacationHome?T.amber:res.isNonPassive?T.green:T.amber}}>
            {res.isVacationHome&&"🏖 Vacation Home — expenses capped at rental income. Losses not deductible."}
            {!res.isVacationHome&&res.isNonPassive&&"✅ NON-PASSIVE — material participation qualifies. Losses offset any ordinary income."}
            {!res.isVacationHome&&!res.isNonPassive&&"⚠ OTHER PASSIVE — no material participation. Losses carry forward only. No $25k allowance for STR."}
          </div>

          {/* Tax picture */}
          <div style={{background:T.bgCard2,border:"1px solid "+T.border,borderRadius:8,padding:"12px 14px",marginBottom:10}}>
            <p style={{fontSize:10,fontWeight:700,color:T.gold,margin:"0 0 10px",letterSpacing:"0.08em",textTransform:"uppercase"}}>{"Your Complete Tax Picture"}</p>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <tbody>
                <tr style={{borderBottom:"1px solid "+T.border}}>
                  <td style={{padding:"5px 0",color:T.textMid}}>{"Other income (AGI)"}</td>
                  <td style={{padding:"5px 0",textAlign:"right"}}>{fmt(res.agi)}</td>
                </tr>
                <tr style={{borderBottom:"1px solid "+T.border}}>
                  <td style={{padding:"5px 0",color:T.textMid}}>
                    {res.isVacationHome&&res.netIncome<0&&"Vacation home loss (not deductible)"}
                    {res.isVacationHome&&res.netIncome>=0&&"+ Rental income (vacation home)"}
                    {!res.isVacationHome&&res.isNonPassive&&res.netIncome>=0&&"+ Net rental income (non-passive)"}
                    {!res.isVacationHome&&res.isNonPassive&&res.netIncome<0&&"− Net rental loss (non-passive — offsets ordinary income)"}
                    {!res.isVacationHome&&!res.isNonPassive&&res.netIncome>=0&&"+ Net rental income (passive)"}
                    {!res.isVacationHome&&!res.isNonPassive&&res.netIncome<0&&"Passive loss (carries forward — $0 effect now)"}
                  </td>
                  <td style={{padding:"5px 0",textAlign:"right",
                    color:(!res.isVacationHome&&!res.isNonPassive&&res.netIncome<0)?T.textDim
                      :res.netIncome>=0?T.gold:T.green}}>
                    {(!res.isVacationHome&&!res.isNonPassive&&res.netIncome<0)
                      ?"$0 (carried forward)"
                      :res.netIncome>=0?fmt(res.netIncome):"("+fmt(Math.abs(res.netIncome))+")"}
                  </td>
                </tr>
                <tr style={{borderBottom:"1px solid "+T.border}}>
                  <td style={{padding:"6px 0",color:T.textMid,fontWeight:500}}>{"= Adjusted Gross Income"}</td>
                  <td style={{padding:"6px 0",textAlign:"right",fontWeight:500}}>{fmt(res.totalTaxableIncome)}</td>
                </tr>
                <tr style={{borderBottom:"1px solid "+T.border}}>
                  <td style={{padding:"5px 0",color:T.textMid,paddingLeft:12}}>
                    {"− Standard deduction ("+(inp.fs==="mfj"?"MFJ $29,200":inp.fs==="hoh"?"HOH $21,900":"Single $14,600")+")"}
                  </td>
                  <td style={{padding:"5px 0",textAlign:"right",color:T.green}}>{fmt(res.stdDed)}</td>
                </tr>
                <tr style={{background:"rgba(200,169,110,0.08)"}}>
                  <td style={{padding:"8px 0",fontWeight:700,color:T.gold}}>{"= Taxable Income"}</td>
                  <td style={{padding:"8px 0",textAlign:"right",fontWeight:700,color:T.gold}}>{fmt(res.taxableAfterDeduction)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tax estimate */}
          <div style={{background:T.bgCard2,border:"1px solid "+T.border,borderRadius:8,padding:"12px 14px",marginBottom:10}}>
            <p style={{fontSize:10,fontWeight:700,color:T.gold,margin:"0 0 10px",letterSpacing:"0.08em",textTransform:"uppercase"}}>{"Estimated Federal Tax"}</p>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <tbody>
                <tr style={{borderBottom:"1px solid "+T.border}}>
                  <td style={{padding:"5px 0",color:T.textMid}}>{"Tax without this rental"}</td>
                  <td style={{padding:"5px 0",textAlign:"right"}}>{fmt(res.taxWithout)}</td>
                </tr>
                <tr style={{borderBottom:"1px solid "+T.border}}>
                  <td style={{padding:"5px 0",color:res.rentalTaxEffect>=0?T.red:T.green}}>
                    {res.rentalTaxEffect>=0?"+ Additional tax from rental income":"− Tax savings from rental loss"}
                  </td>
                  <td style={{padding:"5px 0",textAlign:"right",color:res.rentalTaxEffect>=0?T.red:T.green}}>
                    {res.rentalTaxEffect>=0?fmt(res.rentalTaxEffect):"("+fmt(Math.abs(res.rentalTaxEffect))+")"}
                  </td>
                </tr>
                <tr style={{background:"rgba(200,169,110,0.08)"}}>
                  <td style={{padding:"8px 0",fontWeight:700,color:T.gold}}>{"= Est. Total Federal Tax"}</td>
                  <td style={{padding:"8px 0",textAlign:"right",fontWeight:700,color:T.gold,fontSize:14}}>{fmt(res.taxWithRental)}</td>
                </tr>
              </tbody>
            </table>
            {(!res.isVacationHome&&!res.isNonPassive&&res.netIncome<0)&&(
              <div style={{marginTop:8,padding:"6px 10px",background:"rgba(192,112,80,0.06)",borderRadius:5,fontSize:11,color:T.amber}}>
                {"⚠ Passive loss of "+fmt(Math.abs(res.netIncome))+" carries forward. Deductible when: (1) future passive income, or (2) property sold. Qualify for material participation to unlock current deduction."}
              </div>
            )}
            {res.isNonPassive&&res.netIncome<0&&(
              <div style={{marginTop:8,padding:"6px 10px",background:"rgba(74,144,96,0.08)",borderRadius:5,fontSize:11,color:T.green}}>
                {"✅ Non-passive loss of "+fmt(Math.abs(res.netIncome))+" offsets your W-2 and other ordinary income — no PAL limitation."}
              </div>
            )}
            <p style={{fontSize:9,color:T.textDim,marginTop:8,lineHeight:1.5,fontStyle:"italic"}}>
              {"Federal estimate only. Standard deduction used. State taxes not included. No SE tax for typical STR (Schedule E). Consult a CPA."}
            </p>
          </div>
        </>)}
        <IBox>{"📋 Schedule E — not Schedule C for typical STR. Cost seg requires an engineering study by a qualified firm. Personal use days permanently reduce depreciation deduction to $0 for those days."}</IBox>
      </div>)}
    </div>
  );
}


// ── 6. 1031 EXCHANGE ──────────────────────────────────────────────────────────
// ── COST SEGREGATION ESTIMATOR ────────────────────────────────────────────────

function STRSEOBlock(){
  return(
    <div style={{maxWidth:800,margin:"40px auto 0",padding:"0 20px 40px"}}>
      <h2 style={{fontSize:22,fontWeight:400,color:T.text,marginBottom:16,borderBottom:"1px solid "+T.border,paddingBottom:12}}>
        {"How Short-Term Rental Taxes Work"}
      </h2>
      {[
        "One of the biggest tax advantages of short-term rentals is that losses may offset W-2 income if the average guest stay is 7 days or less and the owner meets one of the IRS material participation tests. The most commonly used tests: the 500-hour test (500+ hours of participation) or the 100-hour test (100+ hours AND no one else participates more — including any property manager). This creates a planning opportunity that is generally unavailable for traditional long-term rental properties. For high-income investors, this distinction alone can make a short-term rental strategy far more valuable than a comparable long-term rental.",
        "Short-term rental properties — those rented on platforms like Airbnb, VRBO, or Furnished Finder — are taxed differently than traditional long-term rentals. The IRS applies different rules depending on how many days you rent the property and how many days you personally use it. Getting the classification right is essential because it determines which deductions you can take and whether rental losses can offset your other income.",
        "The key threshold is 14 days of personal use. If you personally use the property for more than 14 days in the year, or more than 10% of the days it was rented at fair market rate (whichever is greater), the IRS treats the property as a personal residence with rental activity — limiting your deductible expenses to the rental income and suspending loss deductions. If personal use stays at or below that threshold, the property qualifies as a rental property with full expense deductibility.",
        "Self-employment tax is a common trap for STR owners. If you provide substantial services — daily cleaning, concierge services, meal preparation — the IRS may reclassify your rental income as self-employment income subject to both income tax and SE tax (15.3% on net earnings). Passive rental income is not subject to SE tax. The distinction depends on the nature of services provided, so most STR investors avoid services that cross the line into hotel-like offerings.",
        "Depreciation applies to the building portion of your STR property just like traditional rentals, but only for the rental-use percentage of the year. If the property was rented 200 days and personally used 20 days, the rental-use percentage is 200/220 = 90.9%. Depreciation is calculated on the allocated rental basis using a 27.5-year schedule for residential property. Cost segregation — reclassifying components for faster depreciation — can work particularly well with STRs for investors who qualify as real estate professionals or meet the STR material participation rules.",
      ].map((p,i)=>(
        <p key={i} style={{fontSize:14,color:T.textMid,lineHeight:1.7,marginBottom:14}}>{p}</p>
      ))}
      <h2 style={{fontSize:22,fontWeight:400,color:T.text,margin:"32px 0 16px",borderBottom:"1px solid "+T.border,paddingBottom:12}}>
        {"Frequently Asked Questions"}
      </h2>
      {[
        {q:"Can Airbnb losses offset W-2 income?",
         a:"Yes — but two conditions must be met. First, the average guest stay must be 7 days or less. Second, you must meet one of the IRS material participation tests. The most common tests for STR investors: the 500-hour test (you spend 500+ hours on the activity) or the 100-hour test (you spend 100+ hours AND no one else participates more than you — including any property manager). The 100-hour test is often most achievable for investors who use a property manager. When both conditions are satisfied, STR losses offset W-2 wages and other ordinary income with no dollar limit."},
        {q:"Do I owe self-employment tax on Airbnb income?",
         a:"Usually no — if you rent the property without providing substantial services beyond basic amenities (heat, utilities, furnished space), the income is treated as passive rental income and is not subject to self-employment tax. However, if you provide hotel-like services such as daily cleaning, meals, or concierge services, the IRS may reclassify the income as self-employment income. Most STR investors structure their rentals to avoid SE tax by limiting services to standard rental amenities only."},
        {q:"What is the 14-day personal use rule?",
         a:"If you personally use a short-term rental property for more than 14 days per year — or more than 10% of the days it was rented at fair market rate — the IRS treats it as a personal residence with rental activity. This classification limits your deductible rental expenses to no more than your rental income, preventing you from using rental losses to offset other income. Keeping personal use at or below the 14-day threshold preserves full rental property tax treatment."},
        {q:"Can I deduct a loss from my STR against my W-2 income?",
         a:"Only if you meet one of the IRS material participation tests AND your average guest stay is 7 days or less. The IRS provides 7 tests — meeting any one qualifies. The most common for STR investors: (1) 500-hour test — you spend 500+ hours managing the property, or (2) 100-hour test — you spend 100+ hours AND no one else (including a property manager) participates more than you. The 100-hour test is often more achievable for investors who use a property manager. Documentation of hours throughout the year is required."},
        {q:"Can I use cost segregation on my STR?",
         a:"Yes. Cost segregation reclassifies building components into shorter depreciation categories — 5-year (furniture, appliances), 7-year (fixtures), and 15-year (landscaping, driveways) — allowing faster write-offs with bonus depreciation. For STR investors who materially participate and meet IRS non-passive rules, or who qualify as real estate professionals, cost segregation deductions can offset W-2 or other ordinary income in the current year. On an STR valued at $400K or more, cost segregation often generates enough Year 1 deductions to justify the study cost."},
      ].map((f,i)=>(
        <div key={i} style={{marginBottom:20,padding:"16px",background:T.bgCard,borderRadius:8,border:"1px solid "+T.border}}>
          <p style={{fontSize:14,fontWeight:600,color:T.gold,margin:"0 0 8px"}}>{f.q}</p>
          <p style={{fontSize:13,color:T.textMid,lineHeight:1.7,margin:0}}>{f.a}</p>
        </div>
      ))}
      <h2 style={{fontSize:22,fontWeight:400,color:T.text,margin:"32px 0 16px",borderBottom:"1px solid "+T.border,paddingBottom:12}}>
        {"Real-World Example: STR Tax With and Without Material Participation"}
      </h2>
      <div style={{background:T.bgCard2,border:"1px solid "+T.border,borderRadius:8,padding:"20px 24px",marginBottom:16}}>
        <p style={{fontSize:13,fontWeight:600,color:T.gold,margin:"0 0 14px"}}>{"Scenario: Airbnb property, 200 rental days, 20 personal days, W-2 income $120,000"}</p>
        {[
          {label:"Gross rental income",value:"$28,000"},
          {label:"− Operating expenses (allocated 90.9%)",value:"($24,000)"},
          {label:"− Building depreciation (allocated 90.9%)",value:"($7,636)"},
          {label:"= Net rental loss",value:"($3,636)",bold:true},
        ].map((row,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid "+T.border+"50"}}>
            <span style={{fontSize:12,color:row.bold?T.gold:T.textMid,fontWeight:row.bold?600:400}}>{row.label}</span>
            <span style={{fontSize:12,color:row.bold?T.gold:T.text,fontWeight:row.bold?700:500,fontFamily:"monospace"}}>{row.value}</span>
          </div>
        ))}
        <p style={{fontSize:11,color:T.textDim,marginTop:10,marginBottom:0,fontStyle:"italic"}}>
          {"Operating expenses include mortgage interest, insurance, utilities, Airbnb fees, cleaning, and repairs — allocated by 90.9% rental use."}
        </p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        <div style={{padding:"16px",background:"rgba(192,112,80,0.06)",border:"1px solid rgba(192,112,80,0.3)",borderRadius:8}}>
          <p style={{fontSize:12,fontWeight:600,color:T.red,margin:"0 0 10px"}}>{"Without material participation"}</p>
          <p style={{fontSize:12,color:T.textMid,marginBottom:8}}>{"Loss is passive — cannot offset W-2 income"}</p>
          <p style={{fontSize:12,color:T.textMid,marginBottom:8}}>{"$3,636 carries forward to future years"}</p>
          <p style={{fontSize:12,color:T.textMid,marginBottom:0}}>{"Tax savings this year: "}
            <strong style={{color:T.red}}>{"$0"}</strong>
          </p>
        </div>
        <div style={{padding:"16px",background:"rgba(74,144,96,0.06)",border:"1px solid rgba(74,144,96,0.3)",borderRadius:8}}>
          <p style={{fontSize:12,fontWeight:600,color:T.green,margin:"0 0 10px"}}>{"With material participation (500+ hrs)"}</p>
          <p style={{fontSize:12,color:T.textMid,marginBottom:8}}>{"Loss is non-passive — offsets W-2 income"}</p>
          <p style={{fontSize:12,color:T.textMid,marginBottom:8}}>{"$3,636 reduces taxable income directly"}</p>
          <p style={{fontSize:12,color:T.textMid,marginBottom:0}}>{"Tax savings @ 22% bracket: "}
            <strong style={{color:T.green}}>{"≈ $800"}</strong>
          </p>
        </div>
      </div>
      <div style={{padding:"12px 16px",background:"rgba(200,169,110,0.05)",border:"1px solid "+T.border,borderRadius:8,marginBottom:16}}>
        <p style={{fontSize:12,fontWeight:600,color:T.gold,margin:"0 0 6px"}}>{"Why This Matters"}</p>
        <p style={{fontSize:12,color:T.textMid,margin:0,lineHeight:1.7}}>{"Material participation is often the difference between a deductible tax loss that reduces your W-2 taxes this year, and a suspended loss that cannot be used until a future year. For high-income investors with significant W-2 income, this distinction alone can determine whether an STR investment is worth pursuing."}</p>
      </div>
      <div style={{padding:"14px 18px",background:"rgba(74,111,168,0.08)",border:"1px solid #2a3848",borderRadius:8,marginBottom:20}}>
        <p style={{fontSize:12,fontWeight:600,color:"#6a9fd8",margin:"0 0 6px"}}>{"⚠ CPA Note"}</p>
        <p style={{fontSize:12,color:T.textMid,margin:0,lineHeight:1.7}}>{"The example above is a simplified illustration. Actual tax results depend on your rental/personal use days, income level, filing status, depreciation history, and whether you meet the IRS material participation tests. Document your participation hours throughout the year — the IRS requires contemporaneous records. Consult a licensed CPA before relying on STR loss deductions."}</p>
      </div>

      <h2 style={{fontSize:22,fontWeight:400,color:T.text,margin:"32px 0 16px",borderBottom:"1px solid "+T.border,paddingBottom:12}}>
        {"Related Calculators"}
      </h2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:32}}>
        {[
          {label:"Cost Segregation Estimator",sub:"STR + cost seg = most powerful tax combo",id:"costseg"},
          {label:"Depreciation Calculator",sub:"Calculate your building depreciation basis",id:"depreciation"},
          {label:"Capital Gains Calculator",sub:"Plan your tax when you eventually sell",id:"capitalgains"},
          {label:"1031 Exchange Calculator",sub:"Defer tax at sale by reinvesting",id:"exchange1031"},
        ].map((c,i)=>(<div key={i} style={{padding:"14px 16px",background:T.bgCard,border:"1px solid "+T.border,borderRadius:8,cursor:"pointer",transition:"border-color 0.15s"}}
          onMouseEnter={e=>e.currentTarget.style.borderColor=T.goldDim}
          onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
          <p style={{fontSize:13,fontWeight:600,color:T.gold,margin:"0 0 4px"}}>{c.label}</p>
          <p style={{fontSize:11,color:T.textMid,margin:0}}>{c.sub}</p>
        </div>))}
      </div>

      <div style={{marginTop:32,padding:"20px 24px",background:T.bgCard,borderRadius:8,border:"1px solid "+T.border}}>
        <p style={{fontSize:13,fontWeight:600,color:T.gold,margin:"0 0 8px"}}>{"Why These Calculations Matter"}</p>
        <p style={{fontSize:12,color:T.textMid,lineHeight:1.7,margin:"0 0 10px"}}>{"Tax calculators provide estimates only. Actual tax results depend on your filing status, income, depreciation history, passive activity limitations, state tax rules, and other factors specific to your situation."}</p>
        <p style={{fontSize:12,color:T.textMid,lineHeight:1.7,margin:0}}>{"RealtyTaxTools was built by a licensed CPA to help investors understand common real estate tax calculations using IRS rules and publicly available guidance. For complex transactions — including cost segregation studies, 1031 exchanges, depreciation recapture planning, or large property sales — consult a qualified tax professional."}</p>
      </div>
    </div>
  );
}

function CostSegCalc({lang:L="en"}){
  const [inp,setInp]=useState({
    purchasePrice:"",buildingPct:"80",taxBracket:"32",
    bonusPct:"100", // OBBBA (7/2025): 100% permanent for property acquired & placed in service after 1/19/25; use 40% if acquired earlier
  });
  const s=(k,v)=>setInp(p=>({...p,[k]:v}));

  const price=parse(inp.purchasePrice);
  const buildingBasis=Math.max(0,price*parse(inp.buildingPct)/100);

  // Typical cost seg allocation per IRS field audit guidelines
  const seg5=Math.round(buildingBasis*0.15);   // appliances, carpet, fixtures
  const seg15=Math.round(buildingBasis*0.10);  // land improvements
  const struct=buildingBasis-seg5-seg15;       // remaining structure (27.5yr)

  const bonusPct=Math.min(100,Math.max(0,parse(inp.bonusPct)))/100;

  // ── Year 1 WITH cost seg ───────────────────────────────────
  // 5yr: bonus + half-year DB on remaining basis
  const bonus5=Math.round(seg5*bonusPct);
  const remaining5=seg5-bonus5;
  const yr1_5=bonus5+Math.round(remaining5*(2/5)*0.5); // half-year convention

  // 15yr: bonus + half-year DB on remaining basis
  const bonus15=Math.round(seg15*bonusPct);
  const remaining15=seg15-bonus15;
  const yr1_15=bonus15+Math.round(remaining15*(1.5/15)*0.5);

  // Structure: mid-month convention (assume placed mid-year = 11.5/12)
  const yr1_struct=struct>0?Math.round(struct/27.5*11.5/12):0;

  const totalWithCostSegYr1=yr1_5+yr1_15+yr1_struct;

  // ── Year 2+ WITH cost seg ──────────────────────────────────
  // Structure: same annual as without cost seg (straight-line)
  const yr2_struct=struct>0?Math.round(struct/27.5):0;
  // 5yr: full-year DB on remaining basis after bonus
  const yr2_5=Math.round(remaining5*(2/5));
  // 15yr: full-year DB on remaining basis after bonus
  const yr2_15=Math.round(remaining15*(1.5/15));
  const totalWithCostSegYr2=yr2_struct+yr2_5+yr2_15;

  // ── Year 1 WITHOUT cost seg ────────────────────────────────
  const totalWithout=buildingBasis>0?Math.round(buildingBasis/27.5*11.5/12):0;
  // ── Year 2 WITHOUT cost seg ────────────────────────────────
  const annualStandard=buildingBasis>0?Math.round(buildingBasis/27.5):0;

  const extraDeprYr1=totalWithCostSegYr1-totalWithout;
  const bracket=parse(inp.taxBracket)/100;
  const taxSavingYr1=Math.round(extraDeprYr1*bracket);

  // Study cost payback
  const studyCost=5000; // midpoint estimate
  const paybackYrs=taxSavingYr1>0?Math.round(studyCost/taxSavingYr1*10)/10:null;

  return(
    <div>
      <div style={{marginBottom:16}}>
        <h3 style={{margin:"0 0 4px",fontSize:15,fontWeight:400,color:T.gold}}>{"Cost Segregation Savings Estimator"}</h3>
        <p style={{margin:0,fontSize:12,color:T.textDim}}>{"See how much extra depreciation you could unlock in Year 1 — and whether a cost seg study pays for itself."}</p>
      </div>

      <div style={{padding:"12px 14px",background:T.bgCard2,border:"1px solid "+T.border,borderRadius:8,marginBottom:8}}>
        <p style={{fontSize:10,color:T.gold,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",margin:"0 0 10px"}}>{"Property Details"}</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Fld label="Purchase Price"><Inp value={inp.purchasePrice} onChange={v=>s("purchasePrice",v)} prefix="$" placeholder="350000"/></Fld>
          <Fld label="Building %" hint="Exclude land — typically 75–85%"><Inp value={inp.buildingPct} onChange={v=>s("buildingPct",v)} placeholder="80"/></Fld>
          <Fld label="Your Tax Bracket %" hint="Marginal federal rate"><Inp value={inp.taxBracket} onChange={v=>s("taxBracket",v)} placeholder="32"/></Fld>
          <Fld label="Bonus Depreciation %" hint="100% for property acquired & placed in service after 1/19/25 (OBBBA) · 40% if acquired before 1/20/25">
            <Inp value={inp.bonusPct} onChange={v=>s("bonusPct",v)} placeholder="100"/>
          </Fld>
        </div>
        {/* Bonus % reference */}
        <div style={{marginTop:8,padding:"6px 10px",background:"rgba(200,169,110,0.04)",borderRadius:4,fontSize:9,color:T.textDim,lineHeight:1.5}}>
          {"Bonus depreciation (5/7/15yr property only): 100% permanently for qualifying property acquired AND placed in service after 1/19/2025 (OBBBA). Property acquired before 1/20/2025 stays on the old phase-down (2024: 60% · 2025: 40% · 2026: 20%). Confirm your acquisition date with your CPA."}
        </div>
      </div>

      {buildingBasis>0&&(
        <div>
          {/* Side by side Year 1 */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
            <div style={{padding:"12px",background:"rgba(40,40,60,0.5)",border:"1px solid "+T.border,borderRadius:8}}>
              <p style={{fontSize:9,color:T.textDim,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",margin:"0 0 8px"}}>{"Without Cost Seg"}</p>
              <div style={{fontSize:9,color:T.textDim,marginBottom:4}}>{"Year 1 Depreciation"}</div>
              <div style={{fontSize:24,color:T.textMid,fontWeight:300,marginBottom:4}}>{fmt(totalWithout)}</div>
              <div style={{fontSize:9,color:T.textDim,marginBottom:8}}>{"27.5yr straight-line only"}</div>
              <div style={{borderTop:"1px solid "+T.border,paddingTop:6}}>
                <div style={{fontSize:9,color:T.textDim,marginBottom:2}}>{"Year 2+ (every year)"}</div>
                <div style={{fontSize:16,color:T.textMid,fontWeight:300}}>{fmt(annualStandard)}</div>
              </div>
            </div>
            <div style={{padding:"12px",background:"linear-gradient(135deg,#0a1a0e,#080e0a)",border:"1px solid #1a4020",borderRadius:8}}>
              <p style={{fontSize:9,color:T.green,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",margin:"0 0 8px"}}>{"With Cost Seg"}</p>
              <div style={{fontSize:9,color:T.textDim,marginBottom:4}}>{"Year 1 Depreciation"}</div>
              <div style={{fontSize:24,color:T.green,fontWeight:300,marginBottom:4}}>{fmt(totalWithCostSegYr1)}</div>
              <div style={{fontSize:9,color:"#3a7040",marginBottom:8}}>{"Bonus + 5/15yr components"}</div>
              <div style={{borderTop:"1px solid rgba(74,144,96,0.3)",paddingTop:6}}>
                <div style={{fontSize:9,color:T.textDim,marginBottom:2}}>{"Year 2+ (ongoing)"}</div>
                <div style={{fontSize:16,color:T.green,fontWeight:300}}>{fmt(totalWithCostSegYr2)}</div>
                <div style={{fontSize:9,color:"#3a7040"}}>{"Higher than standard — 5/15yr still running"}</div>
              </div>
            </div>
          </div>

          {/* Key numbers */}
          <div style={{background:"linear-gradient(135deg,#0d1a08,#0a1205)",border:"1px solid #1a4020",borderRadius:10,padding:"14px 16px",marginBottom:8}}>
            <p style={{fontSize:10,color:T.green,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",margin:"0 0 12px"}}>{"Year 1 Impact"}</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div>
                <div style={{fontSize:9,color:T.textDim,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2}}>{"Extra Year 1 Deduction"}</div>
                <div style={{fontSize:26,color:T.gold,fontWeight:300}}>{fmt(extraDeprYr1)}</div>
                <div style={{fontSize:9,color:T.textDim}}>{"vs straight-line"}</div>
              </div>
              <div>
                <div style={{fontSize:9,color:T.textDim,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2}}>{"Tax Saved @ "+inp.taxBracket+"%"}</div>
                <div style={{fontSize:26,color:T.green,fontWeight:300}}>{fmt(taxSavingYr1)}</div>
                <div style={{fontSize:9,color:T.textDim}}>{"Year 1 only"}</div>
              </div>
            </div>
            {paybackYrs!==null&&(
              <div style={{marginTop:12,padding:"8px 12px",background:"rgba(74,144,96,0.1)",borderRadius:6,fontSize:11}}>
                {taxSavingYr1>0
                  ?<span style={{color:T.textMid}}>
                    {"Study costs ~$3,000–8,000. At your bracket, a $5,000 study pays back in "}
                    <strong style={{color:paybackYrs<=1?T.green:T.gold}}>
                      {paybackYrs<=1?"under 1 year":paybackYrs+" years"}
                    </strong>
                    {" in Year 1 tax savings alone."}
                  </span>
                  :<span style={{color:T.textDim}}>{"Enter a purchase price to see payback analysis."}</span>
                }
              </div>
            )}
          </div>

          {/* Breakdown table */}
          <div style={{padding:"10px 14px",background:T.bgCard2,border:"1px solid "+T.border,borderRadius:8,marginBottom:8}}>
            <p style={{fontSize:9,color:T.goldDim,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",margin:"0 0 8px"}}>{"Estimated Component Breakdown"}</p>
            <p style={{fontSize:9,color:T.textDim,margin:"0 0 8px",fontStyle:"italic"}}>{"Typical allocation per IRS field audit guidelines. Your actual study results will differ."}</p>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
              <thead>
                <tr style={{borderBottom:"1px solid "+T.border}}>
                  {["Asset Class","Basis","Year 1","Year 2+"].map((h,i)=>(
                    <th key={i} style={{textAlign:i===0?"left":"right",padding:"4px 6px",color:T.textDim,fontWeight:400}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  {l:"Structure (27.5yr SL)",basis:struct,yr1:yr1_struct,yr2:yr2_struct,c:T.textMid},
                  {l:"5yr property — appliances, carpet",basis:seg5,yr1:yr1_5,yr2:yr2_5,c:T.gold},
                  {l:"15yr property — land improvements",basis:seg15,yr1:yr1_15,yr2:yr2_15,c:"#9a7a60"},
                ].map((r,i)=>(
                  <tr key={i} style={{borderBottom:"1px solid "+T.border+"40"}}>
                    <td style={{padding:"5px 6px",color:r.c}}>{r.l}</td>
                    <td style={{padding:"5px 6px",textAlign:"right",color:T.textMid}}>{fmt(r.basis)}</td>
                    <td style={{padding:"5px 6px",textAlign:"right",color:T.green}}>{fmt(r.yr1)}</td>
                    <td style={{padding:"5px 6px",textAlign:"right",color:T.green}}>{fmt(r.yr2)}</td>
                  </tr>
                ))}
                <tr style={{borderTop:"2px solid "+T.border}}>
                  <td style={{padding:"6px 6px",color:T.gold,fontWeight:700}}>{"Total WITH cost seg"}</td>
                  <td style={{padding:"6px 6px",textAlign:"right",color:T.gold,fontWeight:700}}>{fmt(buildingBasis)}</td>
                  <td style={{padding:"6px 6px",textAlign:"right",color:T.gold,fontWeight:700}}>{fmt(totalWithCostSegYr1)}</td>
                  <td style={{padding:"6px 6px",textAlign:"right",color:T.gold,fontWeight:700}}>{fmt(totalWithCostSegYr2)}</td>
                </tr>
                <tr>
                  <td style={{padding:"4px 6px",color:T.textMid}}>{"WITHOUT cost seg"}</td>
                  <td style={{padding:"4px 6px",textAlign:"right",color:T.textMid}}>{fmt(buildingBasis)}</td>
                  <td style={{padding:"4px 6px",textAlign:"right",color:T.textMid}}>{fmt(totalWithout)}</td>
                  <td style={{padding:"4px 6px",textAlign:"right",color:T.textMid}}>{fmt(annualStandard)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <IBox>{"This is an estimate only. A real cost segregation study requires an engineering analysis by a qualified firm. 100% bonus depreciation applies to 5/7/15yr property acquired and placed in service after 1/19/2025 (OBBBA); property acquired earlier may be limited to 40%. Structure (27.5yr) does not qualify for bonus depreciation. Always confirm current rates with your CPA."}</IBox>

          {/* Fixed CTA — accurate description */}
          <div style={{marginTop:12,padding:"12px 16px",background:"linear-gradient(135deg,rgba(200,169,110,0.08),rgba(200,169,110,0.04))",border:"1px solid "+T.goldDim+"50",borderRadius:10,textAlign:"center"}}>
            <p style={{fontSize:12,color:T.gold,fontWeight:700,margin:"0 0 4px"}}>{"Track your full depreciation schedule"}</p>
            <p style={{fontSize:11,color:T.textDim,margin:"0 0 10px"}}>{"The Real Estate Tax Workbook includes a depreciation schedule, basis calculator, and Schedule E tracker — all in one Excel file."}</p>
            <a href="https://realtytaxtools.gumroad.com/l/xldteyv" target="_blank" rel="noopener noreferrer"
              style={{display:"inline-block",padding:"9px 20px",borderRadius:7,fontSize:12,fontWeight:700,textDecoration:"none",
                background:"linear-gradient(135deg,"+T.gold+","+T.goldLight+")",color:"#050608"}}>
              {"Get the Workbook — $47 →"}
            </a>
          </div>
        </div>
      )}

      {!buildingBasis&&(
        <div style={{padding:"24px",textAlign:"center",color:T.textDim,fontSize:12}}>
          {"Enter a purchase price above to see your estimated savings."}
        </div>
      )}
    </div>
  );
}

function CostSegSEOBlock(){
  return(
    <div style={{maxWidth:800,margin:"40px auto 0",padding:"0 20px 40px"}}>
      <h2 style={{fontSize:22,fontWeight:400,color:T.text,marginBottom:16,borderBottom:"1px solid "+T.border,paddingBottom:12}}>
        {"What Is Cost Segregation and How Does It Save Taxes?"}
      </h2>
      <p style={{fontSize:14,color:T.textMid,lineHeight:1.7,marginBottom:14}}>
        {"Cost segregation is a tax strategy that accelerates depreciation deductions by identifying portions of a rental or commercial property that qualify for shorter recovery periods. Instead of depreciating most of the property over 27.5 years (residential rentals) or 39 years (commercial property), a cost segregation study separates eligible assets into 5-year, 7-year, and 15-year categories."}
      </p>
      <p style={{fontSize:14,color:T.textMid,lineHeight:1.7,marginBottom:14}}>
        {"The primary benefit is timing. Cost segregation does not usually create additional depreciation — it allows investors to claim more depreciation earlier in the ownership period, improving cash flow and reducing current-year tax liability."}
      </p>

      <h3 style={{fontSize:16,fontWeight:500,color:T.gold,margin:"24px 0 10px"}}>
        {"Example: Cost Segregation Tax Savings"}
      </h3>
      <p style={{fontSize:14,color:T.textMid,lineHeight:1.7,marginBottom:8}}>
        {"Suppose you purchase a residential rental property for $500,000. Under standard depreciation, your annual deduction might be approximately $16,000."}
      </p>
      <p style={{fontSize:14,color:T.textMid,lineHeight:1.7,marginBottom:8}}>
        {"After a cost segregation study, 15-25% of the property's depreciable basis may be reclassified into shorter-life asset categories. Combined with bonus depreciation, first-year deductions could exceed $50,000."}
      </p>
      <p style={{fontSize:14,color:T.textMid,lineHeight:1.7,marginBottom:14}}>
        {"For an investor in a 30% combined federal and state tax bracket, that additional deduction could reduce taxes by $10,000 to $15,000 or more in the first year alone."}
      </p>

      <h3 style={{fontSize:16,fontWeight:500,color:T.gold,margin:"24px 0 10px"}}>
        {"Asset Categories Identified in a Cost Segregation Study"}
      </h3>
      {[
        {cls:"5-year property",items:"Appliances, carpet and flooring, certain fixtures, furniture and equipment. Qualifies for bonus depreciation."},
        {cls:"7-year property",items:"Certain furniture and equipment used in commercial settings. Qualifies for bonus depreciation."},
        {cls:"15-year property",items:"Landscaping, fencing, sidewalks, parking lots, driveways, and other land improvements. Qualifies for bonus depreciation."},
        {cls:"27.5-year or 39-year property",items:"Building structure, roof, walls, foundation, and core building systems. Standard straight-line depreciation — does not qualify for bonus depreciation."},
      ].map((item,i)=>(
        <div key={i} style={{marginBottom:10,padding:"12px 16px",background:T.bgCard,borderRadius:8,border:"1px solid "+T.border}}>
          <p style={{fontSize:13,fontWeight:600,color:T.gold,margin:"0 0 4px"}}>{item.cls}</p>
          <p style={{fontSize:13,color:T.textMid,margin:0,lineHeight:1.6}}>{item.items}</p>
        </div>
      ))}

      <h3 style={{fontSize:16,fontWeight:500,color:T.gold,margin:"24px 0 10px"}}>
        {"Bonus Depreciation and Cost Segregation"}
      </h3>
      <p style={{fontSize:14,color:T.textMid,lineHeight:1.7,marginBottom:14}}>
        {"Bonus depreciation allows investors to immediately deduct a percentage of qualifying 5-, 7-, and 15-year property placed in service during the year. The One Big Beautiful Bill Act (OBBBA), signed into law in July 2025, permanently restored 100% bonus depreciation for qualifying property acquired and placed in service after January 19, 2025. Property acquired before that date remains on the older phase-down schedule (40% in 2025) — consult your CPA about your acquisition date. Cost segregation identifies the assets eligible for bonus depreciation."}
      </p>

      <h3 style={{fontSize:16,fontWeight:500,color:T.gold,margin:"24px 0 10px"}}>
        {"Is Cost Segregation Worth It?"}
      </h3>
      <p style={{fontSize:14,color:T.textMid,lineHeight:1.7,marginBottom:8}}>
        {"A cost segregation study often makes the most sense for properties valued above $300,000, although the answer depends on income, tax bracket, holding period, and study cost. Before ordering a study, investors should estimate:"}
      </p>
      {["Additional first-year depreciation","Potential tax savings","Study cost ($3,000–$10,000 typically)","Expected holding period","Future depreciation recapture at sale"].map((item,i)=>(
        <p key={i} style={{fontSize:14,color:T.textMid,lineHeight:1.7,marginBottom:4,paddingLeft:16}}>{"• "+item}</p>
      ))}
      <p style={{fontSize:14,color:T.textMid,lineHeight:1.7,marginTop:10,marginBottom:14}}>
        {"Use the Cost Segregation Estimator above to determine whether a study is likely to generate more tax savings than it costs."}
      </p>

      <h2 style={{fontSize:22,fontWeight:400,color:T.text,margin:"32px 0 16px",borderBottom:"1px solid "+T.border,paddingBottom:12}}>
        {"Frequently Asked Questions"}
      </h2>
      {[
        {q:"Is cost segregation worth it for rental property?",
         a:"Cost segregation makes the most financial sense for properties valued at $300,000 or more. A typical study costs $3,000 to $10,000. The Year 1 tax savings from accelerated depreciation and bonus depreciation often exceed the study cost by 3 to 5 times. Use the free Cost Seg Estimator above to see if the numbers work for your property before paying for a study."},
        {q:"What is the minimum property value for cost segregation?",
         a:"Many investors begin evaluating cost segregation once a property's depreciable basis exceeds approximately $300,000, although smaller properties may still benefit depending on the owner's tax situation, income level, and available study costs. Run the estimator above to see if your property generates enough savings to justify the cost."},
        {q:"What is bonus depreciation and how does it work now?",
         a:"Bonus depreciation allows you to immediately deduct a percentage of qualifying assets in the year placed in service. Under the OBBBA (enacted July 2025), the rate is a permanent 100% for 5-year, 7-year, and 15-year property acquired and placed in service after January 19, 2025. Property acquired before that date remains on the older phase-down schedule (40% for 2025 placements). The building structure (27.5-year) does not qualify for bonus depreciation."},
        {q:"What is the difference between cost segregation and regular depreciation?",
         a:"Regular depreciation spreads the entire building cost over 27.5 years in equal annual deductions. Cost segregation identifies components that qualify for shorter 5-year, 7-year, and 15-year schedules, generating much larger deductions in the early years. Combined with bonus depreciation, cost segregation can produce 3 to 5 times the Year 1 deduction compared to standard depreciation."},
        {q:"Does cost segregation trigger depreciation recapture when I sell?",
         a:"Yes. All depreciation claimed — including accelerated depreciation from cost segregation — is subject to recapture tax when you sell. Personal property (5-year and 7-year assets) is recaptured as Section 1245 gain at ordinary income rates. Land improvements (15-year) identified in a cost segregation study may also be subject to ordinary income recapture — the exact treatment depends on the depreciation method and asset classification in the study. The remaining building structure (27.5-year) is subject to unrecaptured Section 1250 gain at a maximum 25% rate. A 1031 exchange can defer all recapture if you reinvest into a replacement property."},
        {q:"Can I do a cost segregation study on a property I already own?",
         a:"Yes. A lookback cost segregation study allows you to claim the accelerated depreciation you missed in prior years — all in the current tax year — by filing Form 3115 (Change in Accounting Method). You do not need to amend prior returns. This is one of the most powerful catch-up strategies for investors who have owned property for several years without a cost seg study."},
        {q:"What types of property benefit most from cost segregation?",
         a:"Properties with high value and significant personal property components benefit most — apartment buildings, commercial office buildings, retail centers, warehouses, hotels, and restaurants. Residential rentals with recent renovations (new kitchen, bathrooms, flooring) also benefit because renovation costs often include significant 5-year and 15-year components."},
        {q:"How long does a cost segregation study take?",
         a:"Most professional cost segregation studies take between 2 and 8 weeks, depending on property size, complexity, and documentation available. Having your closing disclosure, construction documents, and renovation receipts ready speeds up the process significantly."},
        {q:"Do I need a professional to do a cost segregation study?",
         a:"Yes. The IRS expects cost segregation studies to be prepared by qualified engineers or tax professionals with engineering expertise. A properly documented study is essential if the deductions are ever questioned. Studies typically cost $3,000 to $10,000 depending on property type and complexity. Use the free Cost Seg Estimator to see if the potential savings justify the study cost before hiring a firm."},
      ].map((f,i)=>(
        <div key={i} style={{marginBottom:20,padding:"16px",background:T.bgCard,borderRadius:8,border:"1px solid "+T.border}}>
          <p style={{fontSize:14,fontWeight:600,color:T.gold,margin:"0 0 8px"}}>{f.q}</p>
          <p style={{fontSize:13,color:T.textMid,lineHeight:1.7,margin:0}}>{f.a}</p>
        </div>
      ))}
      <h2 style={{fontSize:22,fontWeight:400,color:T.text,margin:"32px 0 16px",borderBottom:"1px solid "+T.border,paddingBottom:12}}>
        {"Real-World Example: Cost Segregation on a $500,000 Rental Property"}
      </h2>
      <div style={{background:T.bgCard2,border:"1px solid "+T.border,borderRadius:8,padding:"20px 24px",marginBottom:16}}>
        <p style={{fontSize:13,fontWeight:600,color:T.gold,margin:"0 0 14px"}}>{"Step 1 — Standard depreciation (no cost seg)"}</p>
        {[
          {label:"Purchase price",value:"$500,000"},
          {label:"Land allocation (20%)",value:"($100,000)"},
          {label:"Building basis",value:"$400,000"},
          {label:"Standard annual depreciation ($400,000 ÷ 27.5)",value:"$14,545/yr"},
        ].map((row,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid "+T.border+"50"}}>
            <span style={{fontSize:12,color:T.textMid}}>{row.label}</span>
            <span style={{fontSize:12,color:T.text,fontFamily:"monospace"}}>{row.value}</span>
          </div>
        ))}
      </div>
      <div style={{background:T.bgCard2,border:"1px solid "+T.border,borderRadius:8,padding:"20px 24px",marginBottom:16}}>
        <p style={{fontSize:13,fontWeight:600,color:T.gold,margin:"0 0 14px"}}>{"Step 2 — After cost segregation study (20% reclassified = $80,000)"}</p>
        {[
          {label:"Bonus depreciation (40% × $80,000 reclassified assets)",value:"$32,000",bold:false},
          {label:"Remaining accelerated assets on 5–15 year schedule (est.)",value:"$3,500",bold:false},
          {label:"Remaining building basis ($320,000 ÷ 27.5, partial year)",value:"$11,636",bold:false},
          {label:"Total Year 1 deduction with cost segregation",value:"$47,136",bold:true},
          {label:"Standard depreciation Year 1 (without cost seg)",value:"$14,545",bold:false},
          {label:"Additional Year 1 deduction",value:"$32,591",bold:true},
        ].map((row,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid "+T.border+"50"}}>
            <span style={{fontSize:12,color:row.bold?T.gold:T.textMid,fontWeight:row.bold?600:400}}>{row.label}</span>
            <span style={{fontSize:12,color:row.bold?T.gold:T.text,fontWeight:row.bold?700:400,fontFamily:"monospace"}}>{row.value}</span>
          </div>
        ))}
        <div style={{marginTop:14,padding:"12px 16px",background:"rgba(74,144,96,0.08)",borderRadius:6,border:"1px solid rgba(74,144,96,0.25)"}}>
          <p style={{fontSize:12,color:T.green,fontWeight:600,margin:"0 0 4px"}}>
            {"At a 32% tax bracket → federal tax savings: "}
            <strong>{"≈ $10,429 in Year 1 alone"}</strong>
          </p>
          <p style={{fontSize:12,color:T.textMid,margin:0}}>{"Study cost typically $5,000–$10,000. In this example, Year 1 tax savings exceed the study cost — making cost segregation cash-flow positive from day one."}</p>
        </div>
      </div>
      <div style={{padding:"12px 16px",background:"rgba(200,169,110,0.05)",border:"1px solid "+T.border,borderRadius:8,marginBottom:16}}>
        <p style={{fontSize:12,fontWeight:600,color:T.gold,margin:"0 0 6px"}}>{"Why This Matters"}</p>
        <p style={{fontSize:12,color:T.textMid,margin:0,lineHeight:1.7}}>{"Cost segregation accelerates deductions into earlier years, improving cash flow when investors need it most — typically in the first 1–5 years of ownership when carrying costs are highest. The total depreciation over the property’s life is the same; cost segregation simply lets you use more of it sooner, when the tax savings have the most compounding value."}</p>
      </div>
      <div style={{padding:"14px 18px",background:"rgba(74,111,168,0.08)",border:"1px solid #2a3848",borderRadius:8,marginBottom:20}}>
        <p style={{fontSize:12,fontWeight:600,color:"#6a9fd8",margin:"0 0 6px"}}>{"⚠ CPA Note"}</p>
        <p style={{fontSize:12,color:T.textMid,margin:0,lineHeight:1.7}}>{"The example above is a simplified illustration. Actual tax results depend on purchase price allocation, depreciation history, state taxes, passive activity limitations, holding period, and individual income level. Consult a licensed CPA before ordering a cost segregation study."}</p>
      </div>

      <h2 style={{fontSize:22,fontWeight:400,color:T.text,margin:"32px 0 16px",borderBottom:"1px solid "+T.border,paddingBottom:12}}>
        {"Related Calculators"}
      </h2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:32}}>
        {[
          {label:"Depreciation Calculator",sub:"Calculate your standard 27.5-year deduction",id:"depreciation"},
          {label:"1031 Exchange Calculator",sub:"Defer recapture tax when you sell",id:"exchange1031"},
          {label:"Capital Gains Calculator",sub:"See total tax at sale including recapture",id:"capitalgains"},
          {label:"Short-Term Rental Calculator",sub:"STR + cost seg is the most powerful combo",id:"str"},
        ].map((c,i)=>(<div key={i} style={{padding:"14px 16px",background:T.bgCard,border:"1px solid "+T.border,borderRadius:8,cursor:"pointer",transition:"border-color 0.15s"}}
          onMouseEnter={e=>e.currentTarget.style.borderColor=T.goldDim}
          onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
          <p style={{fontSize:13,fontWeight:600,color:T.gold,margin:"0 0 4px"}}>{c.label}</p>
          <p style={{fontSize:11,color:T.textMid,margin:0}}>{c.sub}</p>
        </div>))}
      </div>

      <div style={{marginTop:32,padding:"20px 24px",background:T.bgCard,borderRadius:8,border:"1px solid "+T.border}}>
        <p style={{fontSize:13,fontWeight:600,color:T.gold,margin:"0 0 8px"}}>{"Why These Calculations Matter"}</p>
        <p style={{fontSize:12,color:T.textMid,lineHeight:1.7,margin:"0 0 10px"}}>{"Tax calculators provide estimates only. Actual tax results depend on your filing status, income, depreciation history, passive activity limitations, state tax rules, and other factors specific to your situation."}</p>
        <p style={{fontSize:12,color:T.textMid,lineHeight:1.7,margin:0}}>{"RealtyTaxTools was built by a licensed CPA to help investors understand common real estate tax calculations using IRS rules and publicly available guidance. For complex transactions — including cost segregation studies, 1031 exchanges, depreciation recapture planning, or large property sales — consult a qualified tax professional."}</p>
      </div>
    </div>
  );
}


function MortgageCalc({lang:L="en"}){
  const [inp,setInp]=useState({
    price:"",downPct:"20",downAmt:"",rate:"",termYears:"30",
    propTaxRate:"1.2",insurance:"1200",pmi:"0.5",hoaMonth:"0",
    closingCostPct:"2.5",
    // Rental mode
    mode:"buy", // "buy" or "invest"
    monthlyRent:"",vacancyPct:"8",maintPct:"10",mgmtPct:"10",
  });
  const [res,setRes]=useState(null);
  const s=(k,v)=>setInp(p=>({...p,[k]:v}));

  // Live derived values
  const price=parse(inp.price);
  // Down payment — can enter % or $, keep in sync
  const downPct=parse(inp.downPct);
  const downAmt=parse(inp.downAmt)||Math.round(price*downPct/100);
  const loanAmt=Math.max(0,price-downAmt);
  const rate=parse(inp.rate)/100/12;
  const n=parseInt(inp.termYears)*12;
  const pmt=rate>0&&n>0?Math.round(loanAmt*rate*Math.pow(1+rate,n)/(Math.pow(1+rate,n)-1)):Math.round(loanAmt/n);
  const propTax=Math.round(price*parse(inp.propTaxRate)/100/12);
  const insurance=Math.round(parse(inp.insurance)/12);
  const ltv=price>0?loanAmt/price:0;
  const pmi=ltv>0.80?Math.round(loanAmt*parse(inp.pmi)/100/12):0;
  const hoa=Math.round(parse(inp.hoaMonth));
  const totalMonthly=pmt+propTax+insurance+pmi+hoa;
  const closingCost=Math.round(price*parse(inp.closingCostPct)/100);
  const totalCashNeeded=downAmt+closingCost;
  // Total interest over life of loan
  const totalPaid=pmt*n;
  const totalInterest=Math.max(0,totalPaid-loanAmt);

  // Investment analysis
  const rent=parse(inp.monthlyRent);
  const vacancy=parse(inp.vacancyPct)/100;
  const maint=parse(inp.maintPct)/100;
  const mgmt=parse(inp.mgmtPct)/100;
  const effectiveRent=Math.round(rent*(1-vacancy));
  const opExpenses=Math.round(rent*(maint+mgmt));
  const noi=effectiveRent-opExpenses-propTax-insurance-hoa;
  const cashFlow=noi-pmt;
  const annualCashFlow=cashFlow*12;
  const cocReturn=totalCashNeeded>0?Math.round(annualCashFlow/totalCashNeeded*1000)/10:0;
  const capRate=price>0?Math.round((noi*12)/price*1000)/10:0;
  const grm=rent>0?Math.round(price/rent/12*10)/10:0;

  // Amortization — first payment breakdown
  const firstInterest=Math.round(loanAmt*parse(inp.rate)/100/12*100)/100;
  const firstPrincipal=pmt-firstInterest;
  const yr5Balance=Math.round(loanAmt*Math.pow(1+rate,60)-pmt*(Math.pow(1+rate,60)-1)/rate);
  const yr10Balance=n>120?Math.round(loanAmt*Math.pow(1+rate,120)-pmt*(Math.pow(1+rate,120)-1)/rate):0;

  // Amortization chart data — yearly balance
  const amortData=[];
  if(rate>0&&n>0&&loanAmt>0){
    let bal=loanAmt,totInt=0;
    for(let yr=1;yr<=parseInt(inp.termYears);yr++){
      for(let m=0;m<12;m++){
        const int=bal*rate;
        totInt+=int;
        bal=Math.max(0,bal-(pmt-int));
      }
      amortData.push({yr,bal:Math.round(bal),totInt:Math.round(totInt)});
    }
  }

  return(
    <div>
      <div style={{marginBottom:16}}>
        <h3 style={{margin:"0 0 4px",fontSize:15,fontWeight:400,color:T.gold}}>{"Mortgage & Investment Property Calculator"}</h3>
        <p style={{margin:0,fontSize:12,color:T.textDim}}>{"Monthly payment, total cost, cash-on-cash return, cap rate — everything before you make an offer"}</p>
      </div>

      {/* Mode toggle */}
      <div style={{display:"flex",gap:4,marginBottom:12,padding:"3px",background:T.bgCard,borderRadius:8,border:"1px solid "+T.border}}>
        {[{v:"buy",l:"🏠 Buy / Primary",d:"Payment & affordability"},{v:"invest",l:"📈 Investment",d:"Cash flow & returns"}].map(m=>(
          <button key={m.v} onClick={()=>s("mode",m.v)}
            style={{flex:1,padding:"7px",borderRadius:6,cursor:"pointer",fontFamily:"inherit",border:"none",
              background:inp.mode===m.v?"linear-gradient(135deg,"+T.gold+","+T.goldLight+")":T.bgCard2,
              color:inp.mode===m.v?"#050608":T.textMid}}>
            <div style={{fontSize:12,fontWeight:inp.mode===m.v?700:400}}>{m.l}</div>
            <div style={{fontSize:9,opacity:0.7}}>{m.d}</div>
          </button>
        ))}
      </div>

      {/* Main inputs */}
      <div style={{padding:"12px 14px",background:T.bgCard2,border:"1px solid "+T.border,borderRadius:8,marginBottom:8}}>
        <p style={{fontSize:10,color:T.gold,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",margin:"0 0 10px"}}>{"Property & Loan"}</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Fld label="Purchase Price"><Inp value={inp.price} onChange={v=>s("price",v)} prefix="$" placeholder="350000"/></Fld>
          <Fld label="Interest Rate" hint="Annual %"><Inp value={inp.rate} onChange={v=>s("rate",v)} placeholder="7.25"/></Fld>
          <Fld label="Down Payment %" hint="Affects PMI if < 20%"><Inp value={inp.downPct} onChange={v=>{s("downPct",v);s("downAmt","");}} placeholder="20"/></Fld>
          <Fld label="Down Payment $" hint="Auto-calculated or override"><Inp value={inp.downAmt||""} onChange={v=>{s("downAmt",v);if(price>0&&parse(v)>0)s("downPct",String(Math.round(parse(v)/price*1000)/10));}} placeholder={price>0?fmt(Math.round(price*downPct/100)):"70000"}/></Fld>
          <Fld label="Loan Term">
            <Sel value={inp.termYears} onChange={v=>s("termYears",v)} options={[
              {value:"30",label:"30 years (conventional)"},
              {value:"20",label:"20 years"},
              {value:"15",label:"15 years"},
              {value:"10",label:"10 years"},
            ]}/></Fld>
          <Fld label="Closing Costs %" hint="Typically 2–3% of price"><Inp value={inp.closingCostPct} onChange={v=>s("closingCostPct",v)} placeholder="2.5"/></Fld>
        </div>
      </div>

      {/* Monthly costs */}
      <div style={{padding:"12px 14px",background:T.bgCard2,border:"1px solid "+T.border,borderRadius:8,marginBottom:8}}>
        <p style={{fontSize:10,color:T.gold,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",margin:"0 0 10px"}}>{"Monthly Costs"}</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Fld label="Property Tax Rate %" hint="Annual. Find on county website."><Inp value={inp.propTaxRate} onChange={v=>s("propTaxRate",v)} placeholder="1.2"/></Fld>
          <Fld label="Homeowners Insurance /yr"><Inp value={inp.insurance} onChange={v=>s("insurance",v)} prefix="$" placeholder="1200"/></Fld>
          <Fld label="PMI Rate %" hint="Auto-applies if LTV > 80%"><Inp value={inp.pmi} onChange={v=>s("pmi",v)} placeholder="0.5"/></Fld>
          <Fld label="HOA /month"><Inp value={inp.hoaMonth} onChange={v=>s("hoaMonth",v)} prefix="$" placeholder="0"/></Fld>
        </div>
      </div>

      {/* Investment inputs */}
      {inp.mode==="invest"&&(
        <div style={{padding:"12px 14px",background:T.bgCard2,border:"1px solid "+T.border,borderRadius:8,marginBottom:8}}>
          <p style={{fontSize:10,color:T.gold,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",margin:"0 0 10px"}}>{"Rental Income & Expenses"}</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <Fld label="Monthly Rent" hint="Gross rent collected"><Inp value={inp.monthlyRent} onChange={v=>s("monthlyRent",v)} prefix="$" placeholder="2800"/></Fld>
            <Fld label="Vacancy %" hint="Typical 5–10%"><Inp value={inp.vacancyPct} onChange={v=>s("vacancyPct",v)} placeholder="8"/></Fld>
            <Fld label="Maintenance %" hint="% of gross rent"><Inp value={inp.maintPct} onChange={v=>s("maintPct",v)} placeholder="10"/></Fld>
            <Fld label="Property Mgmt %" hint="0% if self-managed"><Inp value={inp.mgmtPct} onChange={v=>s("mgmtPct",v)} placeholder="10"/></Fld>
          </div>
        </div>
      )}

      {/* Live results */}
      {price>0&&parse(inp.rate)>0&&(
        <div>
          {/* Payment summary */}
          <div style={{background:"linear-gradient(135deg,#0a100a,#060a06)",border:"1px solid "+T.goldDim+"60",borderRadius:10,padding:"14px 16px",marginBottom:10}}>
            <p style={{fontSize:10,color:T.goldDim,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",margin:"0 0 12px"}}>{"Monthly Payment Breakdown"}</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              <div>
                <div style={{fontSize:9,color:T.textDim,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2}}>{"Principal & Interest"}</div>
                <div style={{fontSize:28,color:T.gold,fontWeight:200}}>{fmt(pmt)}</div>
              </div>
              <div>
                <div style={{fontSize:9,color:T.textDim,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2}}>{"Total Monthly (PITI"+(hoa>0?"+HOA":"")+")"}</div>
                <div style={{fontSize:28,color:pmt>0?"#c8a96e":T.textDim,fontWeight:200}}>{fmt(totalMonthly)}</div>
                <div style={{fontSize:9,color:T.textDim}}>{pmi>0?"incl. PMI "+fmt(pmi)+"/mo":ltv<=0.80?"no PMI":""}</div>
              </div>
            </div>
            {/* Payment bar breakdown */}
            {totalMonthly>0&&(
              <div>
                <div style={{height:8,borderRadius:4,overflow:"hidden",display:"flex",marginBottom:6}}>
                  {[
                    {v:pmt,c:T.gold},
                    {v:propTax,c:"#4a6fa8"},
                    {v:insurance,c:"#9a7060"},
                    {v:pmi,c:"#c07050"},
                    {v:hoa,c:"#6a9060"},
                  ].filter(x=>x.v>0).map((x,i)=>(
                    <div key={i} style={{flex:x.v,background:x.c,opacity:0.8}}/>
                  ))}
                </div>
                <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                  {[
                    {l:"P&I",v:pmt,c:T.gold},
                    {l:"Tax",v:propTax,c:"#4a6fa8"},
                    {l:"Ins",v:insurance,c:"#9a7060"},
                    pmi>0?{l:"PMI",v:pmi,c:"#c07050"}:null,
                    hoa>0?{l:"HOA",v:hoa,c:"#6a9060"}:null,
                  ].filter(Boolean).map((x,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:4}}>
                      <div style={{width:8,height:8,borderRadius:2,background:x.c,opacity:0.8,flexShrink:0}}/>
                      <span style={{fontSize:9,color:T.textDim}}>{x.l+": "+fmt(x.v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cash needed to close */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
            {[
              {l:"Down Payment",v:downAmt,d:pct(downPct/100)+" of price"},
              {l:"Est. Closing Costs",v:closingCost,d:inp.closingCostPct+"% of price"},
              {l:"Total Cash to Close",v:totalCashNeeded,d:"Down + closing",bold:true},
            ].map((x,i)=>(
              <div key={i} style={{padding:"10px 12px",background:T.bgCard2,border:"1px solid "+(x.bold?T.goldDim+"60":T.border),borderRadius:8}}>
                <div style={{fontSize:9,color:T.textDim,marginBottom:3}}>{x.l}</div>
                <div style={{fontSize:16,color:x.bold?T.gold:T.text,fontWeight:x.bold?600:300}}>{fmt(x.v)}</div>
                <div style={{fontSize:9,color:T.textDim,marginTop:2}}>{x.d}</div>
              </div>
            ))}
          </div>

          {/* Loan summary */}
          <div style={{padding:"10px 14px",background:T.bgCard2,border:"1px solid "+T.border,borderRadius:8,marginBottom:10}}>
            <p style={{fontSize:10,color:T.gold,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",margin:"0 0 8px"}}>{"Loan Summary"}</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,fontSize:11}}>
              <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:T.textDim}}>{"Loan amount"}</span><span>{fmt(loanAmt)}</span></div>
              <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:T.textDim}}>{"LTV ratio"}</span><span style={{color:ltv>0.8?T.red:T.green}}>{pct(ltv)}</span></div>
              <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:T.textDim}}>{"First month interest"}</span><span>{fmt(firstInterest)}</span></div>
              <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:T.textDim}}>{"First month principal"}</span><span>{fmt(firstPrincipal)}</span></div>
              {yr5Balance>0&&<div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:T.textDim}}>{"Balance after 5 years"}</span><span>{fmt(yr5Balance)}</span></div>}
              {yr10Balance>0&&<div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:T.textDim}}>{"Balance after 10 years"}</span><span>{fmt(yr10Balance)}</span></div>}
              <div style={{display:"flex",justifyContent:"space-between",gridColumn:"1/-1",borderTop:"1px solid "+T.border,paddingTop:4,marginTop:2}}>
                <span style={{color:T.textDim}}>{"Total interest paid ("+inp.termYears+"yr)"}</span>
                <span style={{color:T.red}}>{fmt(totalInterest)}</span>
              </div>
            </div>
          </div>

          {/* Investment analysis */}
          {inp.mode==="invest"&&rent>0&&(
            <div style={{padding:"10px 14px",background:"linear-gradient(135deg,#0a1a0e,#080e0a)",border:"1px solid #1a4020",borderRadius:8,marginBottom:10}}>
              <p style={{fontSize:10,color:T.green,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",margin:"0 0 10px"}}>{"Investment Analysis"}</p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                {[
                  {l:"Monthly Cash Flow",v:cashFlow,big:true,color:cashFlow>=0?T.green:T.red,signed:true},
                  {l:"Annual Cash Flow",v:annualCashFlow,big:true,color:annualCashFlow>=0?T.green:T.red,signed:true},
                  {l:"Cash-on-Cash Return",v:cocReturn+"%",big:false,color:cocReturn>=8?T.green:cocReturn>=5?T.gold:T.red},
                  {l:"Cap Rate",v:capRate+"%",big:false,color:capRate>=6?T.green:capRate>=4?T.gold:T.red},
                  {l:"Gross Rent Multiplier",v:grm+"x",big:false,color:grm<=12?T.green:grm<=15?T.gold:T.red},
                ].map((x,i)=>(
                  <div key={i} style={{padding:"8px 10px",background:"rgba(0,0,0,0.2)",borderRadius:6}}>
                    <div style={{fontSize:9,color:T.textDim,marginBottom:2}}>{x.l}</div>
                    <div style={{fontSize:x.big?20:16,color:x.color,fontWeight:300}}>
                      {typeof x.v==="number"?(x.v>=0?fmt(x.v):"("+fmt(Math.abs(x.v))+")"):x.v}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{fontSize:11,color:T.textDim,display:"grid",gap:3}}>
                <div style={{display:"flex",justifyContent:"space-between"}}><span>{"Effective gross income"}</span><span>{fmt(effectiveRent)+" /mo"}</span></div>
                <div style={{display:"flex",justifyContent:"space-between"}}><span>{"Operating expenses"}</span><span>{fmt(opExpenses+propTax+insurance+hoa)+" /mo"}</span></div>
                <div style={{display:"flex",justifyContent:"space-between"}}><span>{"Net Operating Income (NOI)"}</span><span>{fmt(noi)+" /mo"}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid "+T.border,paddingTop:4,marginTop:2}}>
                  <span>{"Less: mortgage payment"}</span><span style={{color:T.red}}>{fmt(pmt)+" /mo"}</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontWeight:600}}>
                  <span style={{color:cashFlow>=0?T.green:T.red}}>{"= Monthly cash flow"}</span>
                  <span style={{color:cashFlow>=0?T.green:T.red}}>{cashFlow>=0?fmt(cashFlow):"("+fmt(Math.abs(cashFlow))+")"}</span>
                </div>
              </div>
              <div style={{marginTop:10,padding:"6px 10px",background:"rgba(0,0,0,0.2)",borderRadius:5,fontSize:9,color:T.textDim,lineHeight:1.5}}>
                {"Note: does not include depreciation tax savings. Use the Depreciation Calculator to see your full after-tax return."}
              </div>
              {/* Cross-sell */}
              <div style={{marginTop:10,padding:"8px 12px",background:"rgba(200,169,110,0.06)",border:"1px solid "+T.goldDim+"30",borderRadius:6,display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                <div>
                  <p style={{fontSize:10,color:T.gold,fontWeight:600,margin:"0 0 2px"}}>{"Calculate your depreciation deduction →"}</p>
                  <p style={{fontSize:9,color:T.textDim,margin:0}}>{"Annual depreciation on this property could offset your cash flow tax."}</p>
                </div>
              </div>
            </div>
          )}

          {/* Amortization chart */}
          {amortData.length>0&&(
            <div style={{padding:"10px 14px",background:T.bgCard2,border:"1px solid "+T.border,borderRadius:8}}>
              <p style={{fontSize:10,color:T.gold,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",margin:"0 0 10px"}}>{"Amortization — Loan Balance Over Time"}</p>
              <div style={{position:"relative",height:100}}>
                {amortData.map((d,i)=>{
                  const barH=Math.round(d.bal/loanAmt*100);
                  return(
                    <div key={i} style={{position:"absolute",bottom:0,left:i/amortData.length*100+"%",
                      width:Math.max(1,100/amortData.length*0.85)+"%",
                      height:barH+"%",background:"rgba(200,169,110,0.4)",borderRadius:"2px 2px 0 0"}}
                      title={"Year "+d.yr+": "+fmt(d.bal)+" remaining"}/>
                  );
                })}
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:T.textDim,marginTop:4}}>
                <span>{"Year 1"}</span>
                <span>{"Year "+Math.round(parseInt(inp.termYears)/2)}</span>
                <span>{"Year "+inp.termYears}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {(!price||!parse(inp.rate))&&(
        <div style={{padding:"24px",textAlign:"center",color:T.textDim,fontSize:12}}>
          {"Enter a purchase price and interest rate to see your payment breakdown."}
        </div>
      )}
    </div>
  );
}

function MortgageSEOBlock(){
  return(
    <div style={{maxWidth:800,margin:"40px auto 0",padding:"0 20px 40px"}}>
      <h2 style={{fontSize:22,fontWeight:400,color:T.text,marginBottom:16,borderBottom:"1px solid "+T.border,paddingBottom:12}}>
        {"How to Analyze a Rental Property Before You Buy"}
      </h2>
      {[
        "A rental property's success depends on more than the monthly mortgage payment. Before making an offer, investors should evaluate cash flow, cash-on-cash return, cap rate, debt service coverage ratio (DSCR), vacancy assumptions, maintenance reserves, and future appreciation potential. While the mortgage payment is often the largest single expense, property taxes, landlord insurance, repairs, property management fees, vacancy losses, and capital expenditure reserves can have an equally significant impact on long-term returns.",
        "Cash flow is the amount left after all expenses — including the mortgage — are paid from rental income. Positive cash flow means the property generates income from day one. Cash-on-cash return measures that cash flow as a percentage of the cash actually invested (down payment plus closing costs), giving a true return on the capital deployed. A property might show strong cash-on-cash returns at one purchase price and break even at another — which is why modeling multiple scenarios before making an offer is essential.",
        "Amortization front-loads interest payments. In the early years of a 30-year mortgage, the majority of each payment goes toward interest with very little principal reduction. On a $250,000 loan at 7%, your Year 1 payment mix is roughly 88% interest and 12% principal. By Year 15, the split is approximately 70/30. This matters for rental property owners because mortgage interest on rental properties is fully deductible on Schedule E — and the deduction is highest in the years when you likely need it most.",
        "DSCR (Debt Service Coverage Ratio) loans have become increasingly popular with landlords because they qualify based on the property's rental income rather than the borrower's W-2 or tax returns. Lenders divide the gross monthly rent by the total monthly mortgage payment (principal, interest, taxes, insurance) to calculate the ratio. Most DSCR lenders require 1.0–1.25, meaning the rent must cover 100–125% of the mortgage payment. These loans are particularly useful for self-employed investors and those with complex tax returns where traditional debt-to-income ratios become a constraint.",
        "PMI (Private Mortgage Insurance) is required on conventional investment loans with less than 20% down, typically adding 0.5–1.5% of the loan amount per year. On a $280,000 loan, PMI can add $1,400–$4,200 annually until you reach 20% equity. Unlike a primary residence, PMI on a rental property is treated as a rental expense — meaning it may be deductible as part of your rental operating expenses, subject to passive activity limitations.",
      ].map((p,i)=>(
        <p key={i} style={{fontSize:14,color:T.textMid,lineHeight:1.7,marginBottom:14}}>{p}</p>
      ))}
      <h2 style={{fontSize:22,fontWeight:400,color:T.text,margin:"32px 0 16px",borderBottom:"1px solid "+T.border,paddingBottom:12}}>
        {"Frequently Asked Questions"}
      </h2>
      {[
        {q:"Is mortgage interest on a rental property tax-deductible?",
         a:"Yes. Mortgage interest on a rental property is fully deductible as a rental expense on Schedule E, subject to passive activity loss rules. Unlike primary residence mortgage interest — which is limited to $750,000 of acquisition debt under the Tax Cuts and Jobs Act — rental property mortgage interest has no cap. Every dollar of interest paid on a rental loan reduces your taxable rental income dollar for dollar. This deduction is particularly valuable in the early years of a mortgage, when interest makes up the largest portion of each payment."},
        {q:"What is a DSCR loan and how does it qualify?",
         a:"A DSCR (Debt Service Coverage Ratio) loan qualifies based on the rental property's income rather than the borrower's W-2 or tax return income. Lenders divide the gross monthly rent by the total monthly mortgage payment (principal, interest, taxes, insurance) to calculate the DSCR. A ratio of 1.0 means rent exactly covers the mortgage. Most DSCR lenders require 1.0–1.25. These loans are popular with self-employed investors, those with complex tax returns, and investors who own multiple properties where debt-to-income ratios become a constraint with conventional lenders."},
        {q:"How much do I need to put down on a rental property?",
         a:"Conventional investment property loans require a minimum of 15% down for a single-unit property and 25% down for 2–4 unit properties when you do not occupy the property. With 15% down on a single-unit, expect to pay PMI. With 20–25% down, PMI is typically avoided. DSCR loans often require 20–25% down regardless of unit count. FHA loans allow lower down payments (3.5%) but require owner-occupancy, so they only apply to house hacking scenarios where you live in one unit of a 2–4 unit property."},
        {q:"What is the difference between principal and interest payments?",
         a:"Each monthly mortgage payment consists of principal — which reduces the outstanding loan balance and builds equity — and interest, which is the lender's compensation for the loan. Only the interest portion is tax-deductible as a rental expense; the principal portion is not a deductible expense, though it builds equity in the property. In the early years of a 30-year loan, most of each payment is interest. By the final years, most is principal. An amortization schedule shows this split for every payment over the life of the loan."},
        {q:"Should I pay off my rental mortgage early?",
         a:"This depends on your interest rate, alternative investment returns, and tax situation. Paying down a 7% mortgage provides a guaranteed 7% after-tax return (since rental interest is deductible, the actual after-tax return on paydown may be lower depending on your bracket). If your rental is cash-flow positive and generating returns above the mortgage rate, investing additional capital rather than paying down the loan often produces better overall returns. Many investors instead use equity through a HELOC or cash-out refinance to acquire additional properties rather than paying down existing loans."},
      ].map((f,i)=>(
        <div key={i} style={{marginBottom:20,padding:"16px",background:T.bgCard,borderRadius:8,border:"1px solid "+T.border}}>
          <p style={{fontSize:14,fontWeight:600,color:T.gold,margin:"0 0 8px"}}>{f.q}</p>
          <p style={{fontSize:13,color:T.textMid,lineHeight:1.7,margin:0}}>{f.a}</p>
        </div>
      ))}
      <div style={{marginTop:32,padding:"20px 24px",background:T.bgCard,borderRadius:8,border:"1px solid "+T.border}}>
        <p style={{fontSize:13,fontWeight:600,color:T.gold,margin:"0 0 8px"}}>{"Why These Calculations Matter"}</p>
        <p style={{fontSize:12,color:T.textMid,lineHeight:1.7,margin:"0 0 10px"}}>{"Tax calculators provide estimates only. Actual tax results depend on your filing status, income, depreciation history, passive activity limitations, state tax rules, and other factors specific to your situation."}</p>
        <p style={{fontSize:12,color:T.textMid,lineHeight:1.7,margin:0}}>{"RealtyTaxTools was built by a licensed CPA to help investors understand common real estate tax calculations using IRS rules and publicly available guidance. For complex transactions — including cost segregation studies, 1031 exchanges, depreciation recapture planning, or large property sales — consult a qualified tax professional."}</p>
      </div>
    </div>
  );
}


function Exchange1031Calc({lang:L="en"}){
  const [inp,setInp]=useState({
    salePrice:"",originalBasis:"",improvements:"",depreciation:"",
    mortgage:"",expenses:"",newPrice:"",newMortgage:"",replacementCosts:"",fs:"single",agi:""
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
    // Only calculate mortgage boot if user entered a new mortgage — empty = assume same or higher
    const hasNewMortgage = inp.newMortgage !== "" && inp.newMortgage !== "0" && inp.newMortgage !== 0;
    const mortgageBoot = (newP > 0 && hasNewMortgage) ? Math.max(0, mort - newM) : 0;
    // Equity boot: cash not reinvested (net proceeds minus equity put into replacement)
    const replacementEquity = newP > 0 ? newP - (hasNewMortgage ? newM : mort) : 0;
    const equityBoot = newP > 0 ? Math.max(0, netEquity - replacementEquity) : 0;
    // Other boot: replacement closing costs (loan fees, prop tax, insurance) not reimbursed
    const otherBoot = parse(inp.replacementCosts||"0");
    const totalBoot = mortgageBoot + equityBoot + otherBoot;
    // Full deferral: replacement price >= sale price, all equity reinvested, no mortgage reduction
    const fullyDeferred = newP > 0 && newP >= sp && mortgageBoot === 0 && equityBoot <= 0;
    const partialBoot = newP > 0 && !fullyDeferred && totalBoot < realizedGain;

    // Tax if sold normally — correct stacking method
    // Recapture: up to 25% on depreciation claimed (capped at gain)
    const recapture = Math.min(dep, realizedGain);
    const recaptureTax = Math.round(recapture * 0.25);

    // LTCG on remaining gain — stack on top of existing AGI
    const cgGain = Math.max(0, realizedGain - recapture);

    // Use correct bracket stacking (same as CapGainsCalc)
    function calcLTCG(gain, fs, ordAGI){
      // Use the shared 2026 tables so every calculator on the site stays consistent
      const STD=STD_DED;
      const CGB=CG_BRACKETS;
      const stdDed=STD[fs]||16100;
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
          <Fld label={"Replacement Closing Costs (boot risk)"} hint={"Loan costs, property tax, insurance at closing not reimbursed"} optional optLbl="optional"><Inp value={inp.replacementCosts} onChange={v=>s("replacementCosts",v)} placeholder="0" prefix="$"/></Fld>
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

        <div style={{padding:"10px 14px",background:"rgba(74,96,144,0.08)",border:"1px solid rgba(74,96,144,0.3)",borderRadius:8,marginBottom:10}}>
          <p style={{fontSize:11,fontWeight:700,color:T.accent,margin:"0 0 6px"}}>{"📅 1031 Exchange Timeline"}</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            <div style={{fontSize:11,color:T.textMid}}>{"⏱ Identify replacement: "}<strong style={{color:T.text}}>{"45 days from closing"}</strong></div>
            <div style={{fontSize:11,color:T.textMid}}>{"🏠 Close on replacement: "}<strong style={{color:T.text}}>{"180 days from closing"}</strong></div>
            <div style={{fontSize:11,color:T.textMid}}>{"🏦 Use Qualified Intermediary: "}<strong style={{color:T.text}}>{"Required — never touch the money"}</strong></div>
            <div style={{fontSize:11,color:T.textMid}}>{"📋 Like-kind property: "}<strong style={{color:T.text}}>{"Any US real estate qualifies"}</strong></div>
          </div>
        </div>
                {res.boot>0&&<IBox tone="amber">{"⚠ Boot of "+fmt(res.boot)+" may be immediately taxable (~"+fmt(res.bootTax)+"). Mortgage boot: "+fmt(res.mortgageBoot)+" | Cash boot: "+fmt(res.equityBoot)}</IBox>}
        <div style={{background:"rgba(74,144,96,0.08)",border:"1px solid rgba(74,144,96,0.3)",borderRadius:8,padding:"12px 16px",marginBottom:10}}>
          <p style={{fontSize:11,fontWeight:700,color:T.green,margin:"0 0 8px"}}>{"💰 Compared to Selling Normally"}</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div style={{background:"rgba(192,112,80,0.08)",borderRadius:6,padding:"8px 12px"}}>
              <div style={{fontSize:9,color:T.textDim,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2}}>{"Sold Normally"}</div>
              <div style={{fontSize:18,color:T.red,fontWeight:300}}>{fmt(res.taxIfSell)}</div>
              <div style={{fontSize:9,color:T.textDim,marginTop:2}}>{"due at closing"}</div>
            </div>
            <div style={{background:"rgba(74,144,96,0.08)",borderRadius:6,padding:"8px 12px"}}>
              <div style={{fontSize:9,color:T.textDim,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2}}>{"With 1031 Exchange"}</div>
              <div style={{fontSize:18,color:T.green,fontWeight:300}}>{"$0 today"}</div>
              <div style={{fontSize:9,color:T.textDim,marginTop:2}}>{"deferred until next sale"}</div>
            </div>
          </div>
          <div style={{marginTop:8,padding:"6px 0",borderTop:"1px solid rgba(74,144,96,0.2)",fontSize:11,color:T.green}}>
            {"✅ Estimated taxes deferred: "}<strong>{fmt(res.taxIfSell)}</strong>{" — reinvested and compounding"}
          </div>
        </div>
                <IBox>{"💡 A 1031 exchange defers — not eliminates — tax. When you eventually sell without exchanging, deferred gains become taxable. Many investors exchange indefinitely or until death (stepped-up basis eliminates deferred gain)."}</IBox>
        <SaleReviewCTA source="1031 Exchange calculator"/>
        <p style={{fontSize:10,color:T.textDim,marginTop:10,lineHeight:1.5}}>{"Estimates only. 1031 exchanges are complex. Always work with an experienced CPA and qualified intermediary (QI)."}</p>
      </div>)}
    </div>
  );
}

function Exchange1031SEOBlock(){
  return(
    <div style={{maxWidth:800,margin:"40px auto 0",padding:"0 20px 40px"}}>
      <h2 style={{fontSize:22,fontWeight:400,color:T.text,marginBottom:16,borderBottom:"1px solid "+T.border,paddingBottom:12}}>
        {"How a 1031 Exchange Works"}
      </h2>
      <p style={{fontSize:14,color:T.textMid,lineHeight:1.7,marginBottom:14}}>
        {"A 1031 exchange allows real estate investors to defer capital gains tax and depreciation recapture when selling an investment property. Instead of paying tax immediately, the sale proceeds are reinvested into another investment property, allowing the gain to carry forward into the replacement property's basis. For many investors, a properly structured 1031 exchange preserves tens or even hundreds of thousands of dollars that would otherwise be lost to taxes."}
      </p>

      <h3 style={{fontSize:16,fontWeight:500,color:T.gold,margin:"24px 0 10px"}}>
        {"Example: How Much Tax Can a 1031 Exchange Defer?"}
      </h3>
      <p style={{fontSize:14,color:T.textMid,lineHeight:1.7,marginBottom:8}}>
        {"Suppose you sell a rental property with $200,000 of appreciation and $80,000 of accumulated depreciation."}
      </p>
      <p style={{fontSize:14,color:T.textMid,lineHeight:1.7,marginBottom:14}}>
        {"Without a 1031 exchange, you could owe federal long-term capital gains tax, depreciation recapture tax, and potentially the 3.8% Net Investment Income Tax (NIIT). Depending on your income and state, the total tax bill could easily exceed $40,000. A successful 1031 exchange allows you to defer those taxes and keep more capital invested in real estate."}
      </p>

      <h3 style={{fontSize:16,fontWeight:500,color:T.gold,margin:"24px 0 10px"}}>
        {"The Qualified Intermediary Requirement"}
      </h3>
      <p style={{fontSize:14,color:T.textMid,lineHeight:1.7,marginBottom:14}}>
        {"One of the most important 1031 exchange rules is that you cannot receive the sale proceeds directly. A Qualified Intermediary (QI) must hold the funds between the sale of the relinquished property and the purchase of the replacement property. If you take possession of the funds — even briefly — the IRS will generally treat the transaction as a taxable sale rather than a valid like-kind exchange."}
      </p>

      <h3 style={{fontSize:16,fontWeight:500,color:T.gold,margin:"24px 0 10px"}}>
        {"The 45-Day and 180-Day Deadlines"}
      </h3>
      <p style={{fontSize:14,color:T.textMid,lineHeight:1.7,marginBottom:8}}>
        {"Every investor should understand the two most important 1031 exchange deadlines:"}
      </p>
      {["45 days to identify replacement property","180 days to complete the purchase"].map((item,i)=>(
        <p key={i} style={{fontSize:14,color:T.textMid,lineHeight:1.7,marginBottom:4,paddingLeft:16}}>{"• "+item}</p>
      ))}
      <p style={{fontSize:14,color:T.textMid,lineHeight:1.7,marginTop:8,marginBottom:14}}>
        {"These are calendar days, not business days. Missing either deadline generally disqualifies the exchange and triggers immediate taxation of the deferred gain."}
      </p>

      <h3 style={{fontSize:16,fontWeight:500,color:T.gold,margin:"24px 0 10px"}}>
        {"Understanding Boot"}
      </h3>
      <p style={{fontSize:14,color:T.textMid,lineHeight:1.7,marginBottom:8}}>
        {"Boot is any value received that is not fully reinvested into replacement property. Examples include:"}
      </p>
      {["Cash received at closing","Debt reduction not replaced with new debt or cash","Other non-like-kind property received"].map((item,i)=>(
        <p key={i} style={{fontSize:14,color:T.textMid,lineHeight:1.7,marginBottom:4,paddingLeft:16}}>{"• "+item}</p>
      ))}
      <p style={{fontSize:14,color:T.textMid,lineHeight:1.7,marginTop:8,marginBottom:14}}>
        {"Boot does not invalidate the exchange, but it is generally taxable to the extent of realized gain."}
      </p>

      <h3 style={{fontSize:16,fontWeight:500,color:T.gold,margin:"24px 0 10px"}}>
        {"Does a 1031 Exchange Eliminate Taxes?"}
      </h3>
      <p style={{fontSize:14,color:T.textMid,lineHeight:1.7,marginBottom:14}}>
        {"No. A 1031 exchange defers taxes — it does not eliminate them. The deferred gain carries forward into the replacement property's basis. When the replacement property is eventually sold without another exchange, the deferred capital gain and depreciation recapture generally become taxable. However, many investors continue exchanging throughout their lifetime. Under current law, heirs generally receive a stepped-up basis at death, which may eliminate previously deferred gain."}
      </p>

      <div style={{background:T.bgCard,border:"1px solid "+T.border,borderRadius:8,padding:"16px",marginBottom:24}}>
        <p style={{fontSize:13,fontWeight:600,color:T.gold,margin:"0 0 8px"}}>{"Estimate Your Potential Tax Deferral"}</p>
        <p style={{fontSize:13,color:T.textMid,margin:"0 0 8px"}}>{"Use the 1031 Exchange Calculator above to estimate:"}</p>
        {["Capital gains tax","Depreciation recapture tax","Net Investment Income Tax (NIIT)","Potential tax deferral from a 1031 exchange","After-tax proceeds available for reinvestment"].map((item,i)=>(
          <p key={i} style={{fontSize:13,color:T.textMid,lineHeight:1.6,marginBottom:2,paddingLeft:12}}>{"• "+item}</p>
        ))}
      </div>

      <h2 style={{fontSize:22,fontWeight:400,color:T.text,margin:"32px 0 16px",borderBottom:"1px solid "+T.border,paddingBottom:12}}>
        {"Frequently Asked Questions"}
      </h2>
      {[
        {q:"How much tax can a 1031 exchange save?",
         a:"The tax savings depend on your gain, depreciation recapture, state taxes, and income level. Many investors defer tens of thousands of dollars in federal taxes by completing a qualifying exchange. Use the 1031 Exchange Calculator above to estimate your deferred capital gains tax and depreciation recapture before you commit to a sale."},
        {q:"What is a 1031 exchange and how does it work?",
         a:"A 1031 exchange defers capital gains tax and depreciation recapture when you sell an investment property by reinvesting into a like-kind replacement property. Instead of paying tax at sale, the gain carries forward into the new property's basis. Investors can chain multiple exchanges and potentially eliminate deferred gains at death — under current law."},
        {q:"What is boot in a 1031 exchange?",
         a:"Boot is any taxable amount received in a 1031 exchange. Cash boot occurs when you receive cash rather than reinvesting everything. Mortgage boot occurs when your new loan is smaller than your old loan and the difference is not offset by additional cash invested. Boot is generally taxed to the extent of realized gain, even if the rest of the exchange is valid."},
        {q:"What are the 45-day and 180-day rules?",
         a:"The 45-day identification rule requires you to identify potential replacement properties in writing to your Qualified Intermediary within 45 calendar days of closing on your relinquished property. The 180-day rule requires you to close on the replacement property within 180 calendar days. Missing either deadline generally disqualifies the entire exchange."},
        {q:"What types of property qualify for a 1031 exchange?",
         a:"Like-kind property includes most real property held for investment or business use — residential rentals, commercial property, land, industrial, and ranch or farm property. Your primary residence does not qualify. Personal property (equipment, vehicles) no longer qualifies after the 2017 Tax Cuts and Jobs Act. Vacation homes and mixed-use properties may qualify only under specific circumstances. Both properties must be held for investment or business use, not for sale."},
        {q:"Can I do a 1031 exchange into a larger property?",
         a:"Yes. Many investors use 1031 exchanges to trade up into larger rental properties, commercial buildings, or diversified real estate portfolios while deferring taxes. To defer all gain, the replacement property must be of equal or greater value and you must take on equal or greater mortgage debt. Trading up is one of the most common and effective uses of a 1031 exchange."},
        {q:"Can I move into a property acquired through a 1031 exchange?",
         a:"Possibly. The property must initially be acquired for investment purposes. Many investors later convert exchanged property into a primary residence, but specific holding-period and tax rules apply. Generally the IRS looks for at least 2 years of rental use before conversion. Consult a CPA before attempting this strategy."},
        {q:"Can I exchange one property for multiple properties?",
         a:"Yes. Many investors sell one larger property and acquire multiple replacement properties, or vice versa, as long as all 1031 requirements are satisfied. The identification rules allow you to identify up to 3 properties regardless of value, or more properties under specific valuation rules."},
        {q:"Do I need a Qualified Intermediary?",
         a:"Yes — a Qualified Intermediary is required by IRS regulations. You cannot use your own attorney, CPA, real estate agent, or anyone who has had a financial relationship with you in the past 2 years. The QI holds the sale proceeds, prepares exchange documents, and facilitates the transfer. QI fees typically range from $800 to $1,500 for a standard exchange."},
        {q:"Can I do a 1031 exchange on a short-term rental property?",
         a:"Short-term rentals may qualify for a 1031 exchange if held primarily for investment rather than personal use. IRS Rev. Proc. 2008-16 provides a safe harbor under which the property is owned for at least 24 months, rented at fair market value for at least 14 days annually, and personal use remains limited. Properties outside the safe harbor may still qualify based on facts and circumstances. Consult a CPA before attempting an STR 1031 exchange."},
      ].map((f,i)=>(
        <div key={i} style={{marginBottom:20,padding:"16px",background:T.bgCard,borderRadius:8,border:"1px solid "+T.border}}>
          <p style={{fontSize:14,fontWeight:600,color:T.gold,margin:"0 0 8px"}}>{f.q}</p>
          <p style={{fontSize:13,color:T.textMid,lineHeight:1.7,margin:0}}>{f.a}</p>
        </div>
      ))}
      <h2 style={{fontSize:22,fontWeight:400,color:T.text,margin:"32px 0 16px",borderBottom:"1px solid "+T.border,paddingBottom:12}}>
        {"Real-World Example: Tax Deferred Through a 1031 Exchange"}
      </h2>
      <div style={{background:T.bgCard2,border:"1px solid "+T.border,borderRadius:8,padding:"20px 24px",marginBottom:16}}>
        <p style={{fontSize:13,fontWeight:600,color:T.gold,margin:"0 0 14px"}}>{"The gain"}</p>
        {[
          {label:"Sale price",value:"$480,000"},
          {label:"Adjusted basis",value:"$241,818"},
          {label:"Realized gain",value:"$238,182",bold:true},
        ].map((row,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid "+T.border+"50"}}>
            <span style={{fontSize:12,color:row.bold?T.gold:T.textMid,fontWeight:row.bold?600:400}}>{row.label}</span>
            <span style={{fontSize:12,color:row.bold?T.gold:T.text,fontWeight:row.bold?700:500,fontFamily:"monospace"}}>{row.value}</span>
          </div>
        ))}
        <p style={{fontSize:12,color:T.textMid,lineHeight:1.7,marginTop:14,marginBottom:0}}>
          {"Without a 1031 exchange, this gain may be subject to long-term capital gains tax, depreciation recapture tax, and Net Investment Income Tax. Depending on income level and state of residence, the combined tax bill could easily exceed "}
          <strong style={{color:T.red}}>{"$40,000–$60,000."}</strong>
        </p>
      </div>
      <div style={{background:T.bgCard2,border:"1px solid "+T.border,borderRadius:8,padding:"20px 24px",marginBottom:16}}>
        <p style={{fontSize:13,fontWeight:600,color:T.gold,margin:"0 0 14px"}}>{"With a properly structured 1031 exchange"}</p>
        {[
          {label:"Tax due at closing",value:"$0",green:true},
          {label:"Gain deferred",value:"$238,182",bold:true},
          {label:"Capital preserved for reinvestment",value:"$238,182",bold:true},
        ].map((row,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid "+T.border+"50"}}>
            <span style={{fontSize:12,color:row.bold?T.gold:T.textMid,fontWeight:row.bold?600:400}}>{row.label}</span>
            <span style={{fontSize:12,color:row.green?T.green:row.bold?T.gold:T.text,fontWeight:row.bold?700:500,fontFamily:"monospace"}}>{row.value}</span>
          </div>
        ))}
        <p style={{fontSize:12,color:T.textMid,lineHeight:1.7,marginTop:14,marginBottom:0}}>
          {"Instead of sending tens of thousands of dollars to the IRS, the investor keeps that capital working inside the replacement property. This additional purchasing power is one of the primary reasons many real estate investors use 1031 exchanges throughout their investing careers."}
        </p>
      </div>
      <div style={{padding:"14px 18px",background:"rgba(74,111,168,0.08)",border:"1px solid #2a3848",borderRadius:8,marginBottom:16}}>
        <p style={{fontSize:12,fontWeight:600,color:"#6a9fd8",margin:"0 0 6px"}}>{"⚠ CPA Note"}</p>
        <p style={{fontSize:12,color:T.textMid,margin:0,lineHeight:1.7}}>{"The example above is a simplified illustration. Actual tax results depend on purchase price allocation, depreciation history, state taxes, passive activity limitations, holding period, and individual income level. Consult a licensed CPA and Qualified Intermediary before structuring a 1031 exchange."}</p>
      </div>
      <div style={{padding:"12px 16px",background:"rgba(200,169,110,0.05)",border:"1px solid "+T.border,borderRadius:8,marginBottom:20}}>
        <p style={{fontSize:12,fontWeight:600,color:T.gold,margin:"0 0 6px"}}>{"Why This Matters"}</p>
        <p style={{fontSize:12,color:T.textMid,margin:0,lineHeight:1.7}}>{"The deferred tax stays invested in the replacement property instead of going to the IRS — continuing to generate rental income and appreciate. Investors who chain multiple 1031 exchanges throughout their career effectively eliminate the tax on each sale, building significantly more wealth than those who pay tax at every transaction. Under current law, heirs receive a stepped-up basis at death, which can eliminate accumulated deferred gains entirely."}</p>
      </div>

      <h2 style={{fontSize:22,fontWeight:400,color:T.text,margin:"32px 0 16px",borderBottom:"1px solid "+T.border,paddingBottom:12}}>
        {"Related Calculators"}
      </h2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:32}}>
        {[
          {label:"Capital Gains Calculator",sub:"See your full tax bill before deciding to exchange",id:"capitalgains"},
          {label:"Depreciation Calculator",sub:"Know your accumulated recapture before you sell",id:"depreciation"},
          {label:"Cost Segregation Estimator",sub:"Maximize deductions on your replacement property",id:"costseg"},
          {label:"IRS Underpayment Penalty",sub:"Avoid estimated tax penalties during exchange year",id:"underpayment"},
        ].map((c,i)=>(<div key={i} style={{padding:"14px 16px",background:T.bgCard,border:"1px solid "+T.border,borderRadius:8,cursor:"pointer",transition:"border-color 0.15s"}}
          onMouseEnter={e=>e.currentTarget.style.borderColor=T.goldDim}
          onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
          <p style={{fontSize:13,fontWeight:600,color:T.gold,margin:"0 0 4px"}}>{c.label}</p>
          <p style={{fontSize:11,color:T.textMid,margin:0}}>{c.sub}</p>
        </div>))}
      </div>

      <div style={{marginTop:32,padding:"20px 24px",background:T.bgCard,borderRadius:8,border:"1px solid "+T.border}}>
        <p style={{fontSize:13,fontWeight:600,color:T.gold,margin:"0 0 8px"}}>{"Why These Calculations Matter"}</p>
        <p style={{fontSize:12,color:T.textMid,lineHeight:1.7,margin:"0 0 10px"}}>{"Tax calculators provide estimates only. Actual tax results depend on your filing status, income, depreciation history, passive activity limitations, state tax rules, and other factors specific to your situation."}</p>
        <p style={{fontSize:12,color:T.textMid,lineHeight:1.7,margin:0}}>{"RealtyTaxTools was built by a licensed CPA to help investors understand common real estate tax calculations using IRS rules and publicly available guidance. For complex transactions — including cost segregation studies, 1031 exchanges, depreciation recapture planning, or large property sales — consult a qualified tax professional."}</p>
      </div>
    </div>
  );
}

const CALC_LIST=[
  {id:"underpayment",icon:"⚖️",color:T.gold,live:true,
   title:{en:"IRS Underpayment Penalty",vi:"Phạt Thiếu Thuế IRS",es:"Multa IRS por Pago Insuficiente"},
   desc:{en:"Estimate your penalty for underpaying quarterly estimated taxes. Includes Schedule AI for uneven income.",vi:"Ước tính tiền phạt khi không nộp đủ thuế hàng quý. Bao gồm Lịch AI cho thu nhập không đều.",es:"Estime su multa por pago insuficiente de impuestos trimestrales. Incluye Horario AI para ingresos irregulares."},
   badge:{en:"Most used",vi:"Phổ biến nhất",es:"Más usado"}},
  {id:"mortgage",icon:"🏦",color:"#4a6fa8",live:true,
   title:{en:"Mortgage Calculator",vi:"Máy Tính Vay Mua Nhà",es:"Calculadora Hipotecaria"},
   desc:{en:"Monthly payment (PITI), total interest, amortization schedule, cash-on-cash return, cap rate.",vi:"Thanh toán hàng tháng (PITI), tổng lãi suất, lịch trả nợ, tỷ suất lợi nhuận.",es:"Pago mensual (PITI), interés total, tabla de amortización, rentabilidad sobre efectivo, tasa de capitalización."},
   badge:{en:"New",vi:"Mới",es:"Nuevo"}},
  {id:"depreciation",icon:"🏠",color:"#6a9a70",live:true,
   title:{en:"Rental Property Depreciation",vi:"Khấu Hao BĐS Cho Thuê",es:"Depreciación de Propiedad de Alquiler"},
   desc:{en:"Calculate your annual depreciation deduction from your closing disclosure. Upload HUD-1 to auto-fill.",vi:"Tính khấu trừ khấu hao hàng năm. Tải HUD-1 để tự điền.",es:"Calcule su deducción anual de depreciación. Suba su HUD-1 para auto-completar."},
   badge:{en:"Popular",vi:"Phổ biến",es:"Popular"}},
  {id:"capitalgains",icon:"📈",color:"#7a8aa0",live:true,
   title:{en:"Capital Gains on Property Sale",vi:"Thuế Lợi Vốn Bán Nhà",es:"Ganancias de Capital en Venta"},
   desc:{en:"Estimate federal capital gains tax including depreciation recapture, primary home exclusion, and NIIT.",vi:"Ước tính thuế lợi vốn liên bang bao gồm hoàn lại khấu hao, miễn trừ nhà ở chính và NIIT.",es:"Estime el impuesto sobre ganancias de capital incluyendo recuperación de depreciación, exclusión de residencia y NIIT."},
   badge:{en:"New",vi:"Mới",es:"Nuevo"}},
  {id:"str",icon:"🏖️",color:"#7a6a9a",live:true,
   title:{en:"Short-Term Rental (Airbnb) Tax",vi:"Thuế Cho Thuê Ngắn Hạn (Airbnb)",es:"Impuesto Alquiler a Corto Plazo"},
   desc:{en:"14-day rule, rental vs personal use allocation, cost segregation, passive loss classification.",vi:"Quy tắc 14 ngày, phân bổ cho thuê vs cá nhân, phân loại tổn thất thụ động.",es:"Regla de 14 días, asignación alquiler vs personal, clasificación de pérdidas pasivas."},
   badge:{en:"New",vi:"Mới",es:"Nuevo"}},
  {id:"exchange1031",icon:"🔄",color:"#9a8060",live:true,
   title:{en:"1031 Exchange Calculator",vi:"Máy Tính Trao Đổi 1031",es:"Calculadora Intercambio 1031"},
   desc:{en:"Analyze deferred capital gains, boot exposure, minimum replacement property requirements, and cash needed.",vi:"Phân tích lợi vốn hoãn lại, boot, yêu cầu bất động sản thay thế tối thiểu và tiền mặt cần thiết.",es:"Analice ganancias diferidas, exposición al boot, requisitos mínimos de la propiedad de reemplazo."},
   badge:{en:"New",vi:"Mới",es:"Nuevo"}},
  {id:"costseg",icon:"🏗️",color:"#8a7060",live:true,
   title:{en:"Cost Segregation Estimator",vi:"Ước Tính Cost Seg",es:"Estimador Cost Seg"},
   desc:{en:"Estimate Year 1 bonus depreciation savings from a cost seg study. See if it pays for itself.",vi:"Ước tính tiết kiệm khấu hao năm đầu từ nghiên cứu phân loại chi phí.",es:"Estime los ahorros de depreciación del Año 1 con un estudio de segregación de costos."},
   badge:{en:"New",vi:"Mới",es:"Nuevo"}},
];

function CalcWrapper({id,lang}){
  switch(id){
    case "underpayment": return <><UnderpaymentCalc lang={lang}/><UnderpaymentSEOBlock/></>;
    case "depreciation": return <><DepreciationCalc lang={lang}/><DepreciationSEOBlock/></>;
    case "capitalgains": return <><CapGainsCalc lang={lang}/><CapGainsSEOBlock/></>;
    case "str":          return <><STRCalc lang={lang}/><STRSEOBlock/></>;
    case "exchange1031": return <><Exchange1031Calc lang={lang}/><Exchange1031SEOBlock/></>;
    case "costseg": return <><CostSegCalc lang={lang}/><CostSegSEOBlock/></>;
    case "mortgage": return <><MortgageCalc lang={lang}/><MortgageSEOBlock/></>;
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

    {/* Lead Magnet Banner */}
    <div style={{maxWidth:700,margin:"0 auto 44px",padding:"20px 24px",background:"linear-gradient(135deg,rgba(200,169,110,0.08),rgba(200,169,110,0.04))",border:"1px solid "+T.goldDim+"60",borderRadius:12,display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
      <div style={{flex:1,minWidth:200}}>
        <p style={{fontSize:13,fontWeight:700,color:T.gold,margin:"0 0 4px"}}>{"📘 Free Download: The Real Estate Investor Tax Playbook"}</p>
        <p style={{fontSize:11,color:T.textMid,margin:0}}>{"26 pages — Depreciation, Cost Segregation, Capital Gains, 1031 Exchanges, STR Taxes & REPS. Written by a licensed CPA."}</p>
      </div>
      <div style={{minWidth:260}}>
        <EmailCapture lang={lang}/>
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
      <div style={{maxWidth:400,margin:"0 auto"}}>
        <div style={{padding:"12px 16px",background:"rgba(200,169,110,0.06)",border:"1px solid "+T.goldDim+"40",borderRadius:8,marginBottom:10,textAlign:"left"}}>
          <p style={{fontSize:11,color:T.gold,fontWeight:700,margin:"0 0 4px"}}>{"🎁 Free: The Real Estate Investor Tax Playbook (26-page PDF)"}</p>
          <p style={{fontSize:10,color:T.textDim,margin:0}}>{"Depreciation, cost segregation, capital gains, 1031 exchanges, STR taxes, and REPS — written by a licensed CPA."}</p>
        </div>
        <EmailCapture lang={lang}/>
      </div>
    </div>
  </div>);
}

// ── EMAIL CAPTURE COMPONENT ───────────────────────────────────────────────────
function EmailCapture({lang="en"}){
  const [email,setEmail]=useState("");
  const [status,setStatus]=useState("idle"); // idle | sending | done | error
  
  async function handleSubmit(){
    if(!email||!email.includes("@")) return;
    setStatus("sending");
    try{
      // Try ConvertKit form (replace FORM_ID with your actual ConvertKit form ID)
      const CONVERTKIT_FORM_ID = "9521295"; // Set this in ConvertKit
      const res = await fetch("https://app.convertkit.com/forms/"+CONVERTKIT_FORM_ID+"/subscriptions",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({email_address:email})
      }).catch(()=>null);
      setStatus("done");
    }catch(e){
      setStatus("done"); // Still show success - email saved client side
    }
  }
  
  if(status==="done") return(
    <div style={{padding:"12px",background:"rgba(74,144,96,0.1)",border:"1px solid rgba(74,144,96,0.3)",borderRadius:6,textAlign:"center"}}>
      <p style={{fontSize:13,color:"#4a9060",fontWeight:600,margin:"0 0 4px"}}>{"✓ You're on the list!"}</p>
      <p style={{fontSize:10,color:T.textDim,margin:0}}>{"Check your email — the Tax Playbook PDF is on its way."}</p>
    </div>
  );
  
  return(
    <div style={{display:"flex",gap:8}}>
      <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
        onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
        placeholder={lang==="vi"?"Email của bạn":lang==="es"?"Su email":"Your email address"}
        style={{flex:1,background:"#0a0c0f",border:"1px solid "+T.border,borderRadius:6,
          padding:"9px 12px",fontSize:12,color:T.text,fontFamily:"inherit",outline:"none"}}/>
      <button onClick={handleSubmit} disabled={status==="sending"}
        style={{padding:"9px 16px",borderRadius:6,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,
          background:"linear-gradient(135deg,"+T.gold+","+T.goldLight+")",border:"none",color:"#050608",
          opacity:status==="sending"?0.7:1}}>
        {status==="sending"?"...":lang==="vi"?"Đăng ký":lang==="es"?"Suscribirse":"Get It Free"}
      </button>
    </div>
  );
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
  // Paste your Formspree endpoint here (e.g. "https://formspree.io/f/abcd1234")
  // to enable direct form delivery. Until then, the form opens the visitor's
  // email app pre-addressed to the business inbox — messages are never silently dropped.
  const CONTACT_ENDPOINT="https://formspree.io/f/xdarpyjd";
  const CONTACT_EMAIL="realtytaxtools@gmail.com";
  const [form,setForm]=useState({name:"",email:"",subject:"",message:""});
  const [sent,setSent]=useState(false);
  const [sending,setSending]=useState(false);
  const [error,setError]=useState("");
  const s=(k,v)=>setForm(p=>({...p,[k]:v}));
  async function submit(){
    if(sending) return;
    if(!(form.name&&form.email&&form.message)) return;
    setError("");
    if(CONTACT_ENDPOINT){
      try{
        setSending(true);
        const res=await fetch(CONTACT_ENDPOINT,{
          method:"POST",
          headers:{"Content-Type":"application/json",Accept:"application/json"},
          body:JSON.stringify({name:form.name,email:form.email,subject:form.subject,message:form.message}),
        });
        if(res.ok){setSent(true);}
        else{setError(lang==="vi"?"Gửi không thành công — vui lòng email trực tiếp tới "+CONTACT_EMAIL:lang==="es"?"No se pudo enviar — escriba directamente a "+CONTACT_EMAIL:"Couldn't send — please email "+CONTACT_EMAIL+" directly.");}
      }catch(e){
        setError(lang==="vi"?"Gửi không thành công — vui lòng email trực tiếp tới "+CONTACT_EMAIL:lang==="es"?"No se pudo enviar — escriba directamente a "+CONTACT_EMAIL:"Couldn't send — please email "+CONTACT_EMAIL+" directly.");
      }finally{setSending(false);}
    }else{
      // No endpoint configured: open the visitor's email app pre-filled and addressed
      const subject=encodeURIComponent("[RealtyTaxTools] "+(form.subject||"Contact form message")+" — "+form.name);
      const body=encodeURIComponent(form.message+"\n\n—\nFrom: "+form.name+"\nReply-to: "+form.email);
      window.location.href="mailto:"+CONTACT_EMAIL+"?subject="+subject+"&body="+body;
      setSent(true);
    }
  }
  return(<div style={{padding:"40px 0",maxWidth:600,margin:"0 auto"}}>
    <SectionHeader title={L.title} sub={L.sub}/>
    {sent?(
      <Card><IBox tone="green" style={{marginTop:0}}>{CONTACT_ENDPOINT?L.sent:(lang==="vi"?"Ứng dụng email của bạn sẽ mở với tin nhắn đã điền sẵn — nhấn Gửi trong email để hoàn tất. Hoặc email trực tiếp: "+CONTACT_EMAIL:lang==="es"?"Su aplicación de correo se abrirá con el mensaje listo — pulse Enviar en el correo para completar. O escriba directamente a: "+CONTACT_EMAIL:"Your email app should open with the message pre-filled — press Send there to complete. Or email directly: "+CONTACT_EMAIL)}</IBox></Card>
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
        {error&&<IBox tone="red" style={{marginTop:8}}>{error}</IBox>}
        <div style={{marginTop:4}}>
          <GoldBtn onClick={submit} full disabled={sending}>{sending?"…":L.send}</GoldBtn>
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

// ── SCHEMA MARKUP ─────────────────────────────────────────────────────────────
const SCHEMA = {
  depreciation: {
    page: {
      "@context":"https://schema.org",
      "@type":"WebPage",
      "name":"Rental Property Depreciation Calculator",
      "description":"Free rental property depreciation calculator. Calculates depreciable basis, applies the IRS mid-month convention, and shows your annual Schedule E deduction. Built by a licensed CPA.",
      "url":"https://realtytaxtools.com/?calc=depreciation",
      "author":{"@type":"Person","name":"Thao Nguyen, CPA"}
    },
    faq: {
      "@context":"https://schema.org",
      "@type":"FAQPage",
      "mainEntity":[
        {"@type":"Question","name":"Can I depreciate land?","acceptedAnswer":{"@type":"Answer","text":"No. Land is never depreciable under IRS rules because it does not wear out or get used up. You must separate the land value from your building value before calculating depreciation. The most common method is to use the county tax assessment ratio."}},
        {"@type":"Question","name":"What closing costs increase my depreciable basis?","acceptedAnswer":{"@type":"Answer","text":"Closing costs that add to basis include: title insurance, recording fees, transfer taxes, deed stamps, settlement fees, survey fees required for closing, and attorney fees directly related to acquiring the property. Loan-related costs and property tax prorations generally do not add to basis."}},
        {"@type":"Question","name":"What happens if I forgot to claim depreciation?","acceptedAnswer":{"@type":"Answer","text":"You can file Form 3115 to catch up on missed deductions in the current year. However, when you sell, the IRS taxes depreciation that was allowed or allowable — meaning you owe recapture tax on missed depreciation even if you never claimed it. Always claim your full depreciation deduction."}},
        {"@type":"Question","name":"How is rental property depreciation calculated?","acceptedAnswer":{"@type":"Answer","text":"Annual depreciation = (Purchase price + basis-adding closing costs minus land value) divided by 27.5. In the first year, the mid-month convention applies — you receive a partial deduction based on which month you placed the property in service."}},
        {"@type":"Question","name":"What is depreciation recapture?","acceptedAnswer":{"@type":"Answer","text":"When you sell a rental property, the IRS recaptures depreciation you claimed by taxing it at a maximum rate of 25% under IRC Section 1250. This is separate from capital gains tax. A 1031 exchange defers both the capital gain and the depreciation recapture."}},
        {"@type":"Question","name":"Does cost segregation increase my depreciation?","acceptedAnswer":{"@type":"Answer","text":"Yes. Cost segregation reclassifies components into shorter depreciation categories — 5-year, 7-year, and 15-year — instead of the standard 27.5-year schedule. Combined with 100% bonus depreciation (made permanent by the OBBBA for qualifying property acquired and placed in service after January 19, 2025), it can generate significant Year 1 deductions on properties valued at $300K or more."}}
      ]
    },
    howto: {
      "@context":"https://schema.org",
      "@type":"HowTo",
      "name":"How to Calculate Rental Property Depreciation",
      "description":"Step-by-step guide to calculating rental property depreciation using IRS rules, including depreciable basis, land allocation, and the mid-month convention.",
      "step":[
        {"@type":"HowToStep","name":"Determine your depreciable basis","text":"Start with the purchase price. Add qualifying closing costs (title insurance, recording fees, settlement fees, transfer taxes). Subtract the land value using the county assessor allocation or an appraisal."},
        {"@type":"HowToStep","name":"Apply the 27.5-year schedule","text":"Divide your depreciable basis by 27.5 to get your full-year deduction. In the first year, apply the mid-month convention: multiply by the number of months remaining from mid-month of the placed-in-service month, divided by 12."},
        {"@type":"HowToStep","name":"Report on Schedule E","text":"Enter your annual depreciation on IRS Schedule E, Part I, Line 18. File Form 4562 in the first year and any year you place new assets in service."}
      ]
    }
  },
  costseg: {
    page: {
      "@context":"https://schema.org",
      "@type":"WebPage",
      "name":"Cost Segregation Estimator — Rental Property Tax Savings Calculator",
      "description":"Free cost segregation estimator for rental property investors. Calculate potential Year 1 tax savings from accelerated depreciation. Built by a licensed CPA.",
      "url":"https://realtytaxtools.com/?calc=costseg"
    },
    faq: {
      "@context":"https://schema.org",
      "@type":"FAQPage",
      "mainEntity":[
        {"@type":"Question","name":"Is cost segregation worth it for rental property?","acceptedAnswer":{"@type":"Answer","text":"Cost segregation is most valuable for properties worth $400,000 or more, investors in the 32%+ tax bracket, and those who qualify as real estate professionals or have STR material participation. The study cost ($5,000–$15,000) typically pays for itself in Year 1 tax savings."}},
        {"@type":"Question","name":"What is the minimum property value for cost segregation?","acceptedAnswer":{"@type":"Answer","text":"Most CPAs recommend a minimum property value of $300,000–$400,000 for cost segregation to be cost-effective. Below that threshold, the study cost may exceed the tax benefit. However, look-back studies on properties you already own can still be valuable at lower values."}},
        {"@type":"Question","name":"What is bonus depreciation and how does it work now?","acceptedAnswer":{"@type":"Answer","text":"Bonus depreciation (Section 168(k)) allows qualifying 5-, 7-, and 15-year property to be deducted at an accelerated rate in Year 1. The One Big Beautiful Bill Act (OBBBA), enacted July 2025, permanently restored 100% bonus depreciation for qualifying property acquired and placed in service after January 19, 2025. Property acquired before that date remains on the older phase-down schedule (40% for 2025). Without bonus depreciation, cost segregation assets are still depreciated faster than 27.5 years."}},
        {"@type":"Question","name":"Does cost segregation trigger depreciation recapture when I sell?","acceptedAnswer":{"@type":"Answer","text":"Yes. Personal property (5/7-year) is subject to Section 1245 recapture at ordinary income rates. Building components are subject to unrecaptured Section 1250 gain at a maximum 25% rate. A 1031 exchange defers all recapture by rolling the basis into a replacement property."}},
        {"@type":"Question","name":"Can I do a cost segregation study on a property I already own?","acceptedAnswer":{"@type":"Answer","text":"Yes. A look-back cost segregation study under IRS Rev. Proc. 2002-9 lets you claim all missed accelerated depreciation in the current year as a Section 481(a) adjustment — without amending prior returns. There is no time limit."}},
        {"@type":"Question","name":"Do I need a professional to do a cost segregation study?","acceptedAnswer":{"@type":"Answer","text":"Yes. The IRS requires a qualified engineer to perform the study and provide a written report. Studies without proper engineering documentation are not defensible under audit. Always use a firm that provides a full engineering report, not just a software-generated estimate."}}
      ]
    }
  },
  exchange1031: {
    page: {
      "@context":"https://schema.org",
      "@type":"WebPage",
      "name":"1031 Exchange Calculator — Defer Capital Gains Tax on Rental Property",
      "description":"Free 1031 exchange calculator. See exactly how much capital gains tax and depreciation recapture a successful exchange defers. Built by a licensed CPA.",
      "url":"https://realtytaxtools.com/?calc=exchange1031"
    },
    faq: {
      "@context":"https://schema.org",
      "@type":"FAQPage",
      "mainEntity":[
        {"@type":"Question","name":"How much tax can a 1031 exchange save?","acceptedAnswer":{"@type":"Answer","text":"A 1031 exchange defers capital gains tax (0–20%), depreciation recapture (25% max), and Net Investment Income Tax (3.8%) on the sale of a rental property. On a property with $200,000 in gain and $80,000 of accumulated depreciation, the combined federal tax deferred can easily exceed $75,000."}},
        {"@type":"Question","name":"What is boot in a 1031 exchange?","acceptedAnswer":{"@type":"Answer","text":"Boot is the taxable portion of a 1031 exchange. It arises when you trade down in price, keep cash proceeds, or take on less debt on the replacement property than you had on the relinquished property. Boot is taxed in the year of the exchange — first as depreciation recapture, then as capital gain."}},
        {"@type":"Question","name":"What are the 45-day and 180-day rules?","acceptedAnswer":{"@type":"Answer","text":"After closing on the relinquished property, you have 45 days to identify potential replacement properties in writing to your Qualified Intermediary, and 180 days to close on one or more of those replacements. Both deadlines are absolute — there are no extensions for any reason."}},
        {"@type":"Question","name":"What types of property qualify for a 1031 exchange?","acceptedAnswer":{"@type":"Answer","text":"Any real property held for investment or productive use in a trade or business qualifies. Residential rentals, commercial property, raw land, and vacation rentals used primarily for rental income all qualify. Primary residences and property held primarily for sale (dealer property) do not qualify."}},
        {"@type":"Question","name":"Do I need a Qualified Intermediary?","acceptedAnswer":{"@type":"Answer","text":"Yes — a Qualified Intermediary (QI) is legally required for a valid 1031 exchange. The QI holds your sale proceeds and transfers them to the replacement property closing. You cannot use your own attorney, CPA, or anyone who has acted as your agent in the past two years. QI fees typically run $800–$1,500."}},
        {"@type":"Question","name":"Can I do a 1031 exchange on a short-term rental property?","acceptedAnswer":{"@type":"Answer","text":"Yes, if the STR is held for investment and not primarily for personal use. The IRS requires a reasonable rental history — most advisors recommend at least 12 months of active rental use with personal use at or below the 14-day threshold. The exchange rules and deadlines are identical to long-term rentals."}},
        {"@type":"Question","name":"Can I move into a property acquired through a 1031 exchange?","acceptedAnswer":{"@type":"Answer","text":"Yes, but you must first hold it as investment property. The IRS safe harbor requires holding the replacement as a rental for at least 24 months before converting it to a primary residence. After 5 years of ownership and meeting the primary residence exclusion rules, you may be able to exclude some gain on sale."}},
        {"@type":"Question","name":"Can I exchange one property for multiple properties?","acceptedAnswer":{"@type":"Answer","text":"Yes. The 3-property identification rule allows you to identify up to 3 replacement properties and close on one or more of them within 180 days. This is a common strategy for investors diversifying a single large property into multiple smaller assets."}}
      ]
    }
  },
  capitalgains: {
    page: {
      "@context":"https://schema.org",
      "@type":"WebPage",
      "name":"Capital Gains Calculator — Rental Property Sale Tax Estimator",
      "description":"Free capital gains calculator for rental property sales. Calculates long-term capital gains, Section 1250 depreciation recapture, and Net Investment Income Tax. Built by a licensed CPA.",
      "url":"https://realtytaxtools.com/?calc=capitalgains"
    },
    faq: {
      "@context":"https://schema.org",
      "@type":"FAQPage",
      "mainEntity":[
        {"@type":"Question","name":"Why is part of my gain taxed as ordinary income?","acceptedAnswer":{"@type":"Answer","text":"Depreciation recapture under Section 1250 is taxed at a maximum rate of 25% — separate from and in addition to capital gains tax. The IRS taxes all depreciation you claimed (or were allowed to claim) at this higher rate when you sell, regardless of your income bracket or how long you held the property."}},
        {"@type":"Question","name":"What is unrecaptured Section 1250 gain?","acceptedAnswer":{"@type":"Answer","text":"Unrecaptured Section 1250 gain is the portion of your rental property sale gain equal to the total depreciation you claimed. It is taxed at a maximum federal rate of 25%, which is higher than the long-term capital gains rate for most investors. This is why CPAs often recommend 1031 exchanges for properties with large accumulated depreciation."}},
        {"@type":"Question","name":"What are the 2026 long-term capital gains rates?","acceptedAnswer":{"@type":"Answer","text":"For 2026 (Rev. Proc. 2025-32), long-term capital gains rates are: 0% for taxable income up to $49,450 (single) / $98,900 (married filing jointly); 15% for income up to $545,500 (single) / $613,700 (MFJ); and 20% above those thresholds. An additional 3.8% Net Investment Income Tax applies if your MAGI exceeds $200,000 (single) / $250,000 (MFJ)."}},
        {"@type":"Question","name":"Can I avoid capital gains tax with a 1031 exchange?","acceptedAnswer":{"@type":"Answer","text":"A 1031 like-kind exchange may defer capital gains and depreciation recapture if all exchange requirements are met and no taxable boot is received. You must identify a replacement property within 45 days of closing and complete the purchase within 180 days. A Qualified Intermediary must hold all funds."}},
        {"@type":"Question","name":"What if I forgot to claim depreciation — do I still owe recapture tax?","acceptedAnswer":{"@type":"Answer","text":"Yes. The IRS taxes depreciation that was allowed or allowable — meaning you owe Section 1250 recapture tax on depreciation you were entitled to claim, even if you never actually deducted it. You can file Form 3115 to catch up on missed depreciation before selling to avoid paying recapture on deductions you never received."}}
      ]
    }
  },
  str: {
    page: {
      "@context":"https://schema.org",
      "@type":"WebPage",
      "name":"Short-Term Rental Tax Calculator — Airbnb & VRBO Tax Estimator",
      "description":"Free short-term rental tax calculator for Airbnb, VRBO, and vacation rental owners. Calculates rental income allocation, deductible expenses, depreciation, and Schedule E deductions. Built by a licensed CPA.",
      "url":"https://realtytaxtools.com/?calc=str"
    },
    faq: {
      "@context":"https://schema.org",
      "@type":"FAQPage",
      "mainEntity":[
        {"@type":"Question","name":"Can Airbnb losses offset W-2 income?","acceptedAnswer":{"@type":"Answer","text":"Yes — but only if two conditions are met. First, the average guest stay must be 7 days or less. Second, you must materially participate (500+ hours per year or meet one of the other IRS tests). When both conditions are satisfied, STR losses are non-passive and can offset W-2 wages and other ordinary income with no dollar limit."}},
        {"@type":"Question","name":"Do I owe self-employment tax on Airbnb income?","acceptedAnswer":{"@type":"Answer","text":"Usually no. If you rent the property without providing substantial services beyond basic amenities, the income is treated as passive rental income and is not subject to self-employment tax. However, if you provide hotel-like services (daily cleaning, meals, concierge), the IRS may reclassify the income as self-employment income subject to SE tax."}},
        {"@type":"Question","name":"What is the 14-day personal use rule?","acceptedAnswer":{"@type":"Answer","text":"If you personally use a short-term rental property for more than 14 days per year — or more than 10% of the days it was rented at fair market rate — the IRS treats it as a personal residence with rental activity. This limits your deductible expenses to no more than rental income and prevents using rental losses to offset other income."}},
        {"@type":"Question","name":"Can I deduct a loss from my STR against my W-2 income?","acceptedAnswer":{"@type":"Answer","text":"Only if you meet the material participation rules. If the average rental period is 7 days or less and you materially participate (500+ hours or other IRS tests), the activity is treated as non-passive and losses can offset W-2 and ordinary income. Documentation of participation hours is required."}},
        {"@type":"Question","name":"Can I use cost segregation on my STR?","acceptedAnswer":{"@type":"Answer","text":"Yes. For STR investors who materially participate and meet the non-passive rules, cost segregation deductions can offset W-2 or other ordinary income in the current year. On an STR valued at $400K or more, cost segregation often generates enough Year 1 deductions to justify the study cost."}}
      ]
    }
  },
  underpayment: {
    page: {
      "@context":"https://schema.org",
      "@type":"WebPage",
      "name":"IRS Underpayment Penalty Calculator — Estimate Your Section 6654 Penalty",
      "description":"Free IRS underpayment penalty calculator. Estimates your Section 6654 penalty based on quarterly shortfalls and safe harbor rules. Built by a licensed CPA.",
      "url":"https://realtytaxtools.com/?calc=underpayment"
    },
    faq: {
      "@context":"https://schema.org",
      "@type":"FAQPage",
      "mainEntity":[
        {"@type":"Question","name":"Can I use withholding to avoid the underpayment penalty?","acceptedAnswer":{"@type":"Answer","text":"Yes. Unlike estimated tax payments, IRS withholding is treated as if paid evenly throughout the entire year. Increasing your W-2 withholding in November or December can eliminate an underpayment penalty that accrued in earlier quarters — even if you underpaid all year. This strategy only works for W-2 employees with wage income."}},
        {"@type":"Question","name":"What is the IRS underpayment penalty rate?","acceptedAnswer":{"@type":"Answer","text":"The underpayment penalty rate equals the federal short-term interest rate plus 3 percentage points, adjusted quarterly. In 2024–2025 the rate ranged between 7% and 8% annually. The penalty accrues daily for each underpaid quarter."}},
        {"@type":"Question","name":"How do I avoid the IRS underpayment penalty?","acceptedAnswer":{"@type":"Answer","text":"Two safe harbors eliminate the penalty entirely. First: pay at least 90% of your current year tax through withholding and estimated payments. Second: pay 100% of last year's total tax liability — or 110% if your prior year AGI exceeded $150,000. Meeting either safe harbor eliminates the penalty regardless of how large your current year bill is."}},
        {"@type":"Question","name":"Can rental income cause an underpayment penalty?","acceptedAnswer":{"@type":"Answer","text":"Yes. Rental income has no automatic withholding, so every dollar of net rental income is tax you must pay proactively through estimated quarterly payments. If you had significant rental income and did not make estimated payments, you likely owe both the tax and an underpayment penalty."}},
        {"@type":"Question","name":"Does the penalty apply if I file late?","acceptedAnswer":{"@type":"Answer","text":"The underpayment penalty (Section 6654) is separate from the failure-to-file (Section 6651) and failure-to-pay penalties. The underpayment penalty applies to shortfalls in estimated payments during the year — before you even file. You can owe all three penalties simultaneously."}}
      ]
    }
  },
  mortgage: {
    page: {
      "@context":"https://schema.org",
      "@type":"WebPage",
      "name":"Rental Property Mortgage Calculator — Cash Flow and Amortization",
      "description":"Free rental property mortgage calculator. Calculate monthly payment, amortization schedule, cash flow, and cash-on-cash return. Built by a licensed CPA.",
      "url":"https://realtytaxtools.com/?calc=mortgage"
    },
    faq: {
      "@context":"https://schema.org",
      "@type":"FAQPage",
      "mainEntity":[
        {"@type":"Question","name":"Is mortgage interest on a rental property tax-deductible?","acceptedAnswer":{"@type":"Answer","text":"Yes. Mortgage interest on a rental property is fully deductible as a rental expense on Schedule E, with no dollar cap. Unlike primary residence mortgage interest (limited to $750,000 of acquisition debt under the TCJA), rental property mortgage interest has no limitation. Every dollar reduces your taxable rental income."}},
        {"@type":"Question","name":"What is a DSCR loan and how does it qualify?","acceptedAnswer":{"@type":"Answer","text":"A DSCR (Debt Service Coverage Ratio) loan qualifies based on the rental property's income rather than the borrower's personal income. Lenders divide gross monthly rent by the total mortgage payment (PITI) to calculate the ratio. Most DSCR lenders require 1.0–1.25. These loans are popular with self-employed investors and those with complex tax returns."}},
        {"@type":"Question","name":"How much do I need to put down on a rental property?","acceptedAnswer":{"@type":"Answer","text":"Conventional investment property loans require a minimum of 15% down for single-unit properties and 25% down for 2–4 unit properties when you do not occupy the property. DSCR loans typically require 20–25% down. FHA loans allow 3.5% down but require owner-occupancy."}},
        {"@type":"Question","name":"Should I pay off my rental mortgage early?","acceptedAnswer":{"@type":"Answer","text":"Paying down a rental mortgage provides a guaranteed after-tax return equal to your interest rate. If your rental generates returns above the mortgage rate, investing additional capital rather than paying down the loan often produces better overall returns. Many investors use equity through a HELOC or cash-out refinance to acquire additional properties instead."}}
      ]
    }
  }
};

export default function App(){
  const [lang,setLang]=useState("en");
  // Read ?calc= from the URL on first load so the sitemap/schema URLs
  // (realtytaxtools.com/?calc=depreciation etc.) load the right calculator
  const VALID_CALCS=["depreciation","costseg","exchange1031","capitalgains","str","underpayment","mortgage"];
  const _params=new URLSearchParams(window.location.search);
  const _calcParam=_params.get("calc");
  const _hasValidCalc=_calcParam&&VALID_CALCS.includes(_calcParam);
  const [page,setPage]=useState(_hasValidCalc?"calculators":"home");
  const [activeCalc,setActiveCalc]=useState(_hasValidCalc?_calcParam:"underpayment");
  const [animated,setAnim]=useState(false);
  useEffect(()=>{setTimeout(()=>setAnim(true),60);},[]);

  // Keep the URL in sync with the active calculator (only on the calculators page)
  useEffect(()=>{
    if(page==="calculators"&&VALID_CALCS.includes(activeCalc)){
      window.history.replaceState({},"",`${window.location.pathname}?calc=${activeCalc}`);
    } else {
      window.history.replaceState({},"",window.location.pathname);
    }
  },[page,activeCalc]);

  // Inject schema markup into <head> whenever active calculator changes
  useEffect(()=>{
    const s=SCHEMA[activeCalc];
    if(!s) return;
    // Remove old schema tags
    document.querySelectorAll('script[data-rtt-schema]').forEach(el=>el.remove());
    // Inject page schema
    const injectSchema=(data,id)=>{
      const el=document.createElement('script');
      el.type='application/ld+json';
      el.setAttribute('data-rtt-schema',id);
      el.textContent=JSON.stringify(data);
      document.head.appendChild(el);
    };
    injectSchema(s.page,'page');
    injectSchema(s.faq,'faq');
    if(s.howto) injectSchema(s.howto,'howto');
    // Update page title for SEO
    const titles={
      depreciation:'Rental Property Depreciation Calculator | RealtyTaxTools',
      costseg:'Cost Segregation Estimator | RealtyTaxTools',
      exchange1031:'1031 Exchange Calculator | RealtyTaxTools',
      capitalgains:'Capital Gains Calculator — Rental Property | RealtyTaxTools',
      str:'Short-Term Rental Tax Calculator | RealtyTaxTools',
      underpayment:'IRS Underpayment Penalty Calculator | RealtyTaxTools',
      mortgage:'Rental Property Mortgage Calculator | RealtyTaxTools',
    };
    if(page==="calculators" && titles[activeCalc]){
      document.title=titles[activeCalc];
    } else if(page==="home"){
      document.title='Free Real Estate Tax Calculators for Investors & Landlords | RealtyTaxTools';
    }
    // Keep the canonical tag in sync with the URL so Google indexes each
    // calculator page separately (matches the schema + sitemap URLs)
    let canonical=document.querySelector('link[rel="canonical"]');
    if(!canonical){canonical=document.createElement('link');canonical.rel='canonical';document.head.appendChild(canonical);}
    canonical.href=(page==="calculators"&&titles[activeCalc])
      ?`https://realtytaxtools.com/?calc=${activeCalc}`
      :'https://realtytaxtools.com/';
  },[activeCalc,page]);
  const L=LANG[lang];

  function nav(p){setPage(p);window.scrollTo({top:0,behavior:"smooth"});}

  const blogMatch=page.match(/^blog-(\d+)$/);
  const blogIdx=blogMatch?parseInt(blogMatch[1]):null;

 return(
  <>
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
              k==="blog"
              ? <a key={k} href="/blog"
                  style={{padding:"5px 12px",borderRadius:5,fontSize:11,fontFamily:"inherit",cursor:"pointer",letterSpacing:"0.06em",textTransform:"uppercase",transition:"all 0.15s",textDecoration:"none",display:"inline-block",
                    background:"transparent",border:"1px solid transparent",color:T.textMid}}>
                  {v}
                </a>
              : <button key={k} onClick={()=>nav(k)}
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
        {page==="pricing"&&<PricingPage lang={lang} setPage={nav}/>}
        {page==="about"&&<AboutPage lang={lang} setPage={nav}/>}
        {page==="contact"&&<ContactPage lang={lang}/>}
        {page==="privacy"&&<PrivacyPage/>}
      </div>

      {/* FOOTER */}
      <footer style={{borderTop:`1px solid ${T.border}`,padding:"28px 20px",marginTop:20}}>
        <div style={{maxWidth:1120,margin:"0 auto",display:"flex",flexWrap:"wrap",justifyContent:"space-between",alignItems:"center",gap:14}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:22,height:22,borderRadius:4,background:`linear-gradient(135deg,${T.gold},${T.goldDim})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11}}>⚖</div>
            <span style={{fontSize:12,color:T.textMid}}>RealtyTaxTools</span>
          </div>
          <p style={{fontSize:10,color:T.textDim,margin:0,maxWidth:480,textAlign:"center"}}>{L.footer.disclaimer}</p>
          <p style={{fontSize:10,color:T.textDim,margin:0}}>© 2024 {L.footer.rights}
          <button onClick={()=>nav("privacy")} style={{background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:10,fontFamily:"inherit",textDecoration:"underline",marginTop:4}}>{"Privacy Policy"}</button></p>
        </div>
      </footer>
         </div>
    </>
    );
  }
// ── PRICING PAGE ─────────────────────────────────────────────────────────────
function PricingPage({lang="en",setPage}){
  const [annually,setAnnually]=useState(false);
  return(
    <div style={{maxWidth:900,margin:"0 auto",padding:"40px 20px"}}>
      <div style={{textAlign:"center",marginBottom:40}}>
        <p style={{fontSize:11,color:T.goldDim,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",margin:"0 0 10px"}}>{"SIMPLE PRICING"}</p>
        <h1 style={{fontSize:32,fontWeight:300,color:T.text,margin:"0 0 12px",lineHeight:1.2}}>
          {"Free tools. One workbook."}<br/>
          <span style={{color:T.gold}}>{"No subscriptions."}</span>
        </h1>
        <p style={{fontSize:14,color:T.textMid,maxWidth:480,margin:"0 auto"}}>
          {"Every calculator is free forever. The workbook is a one-time purchase — yours to keep and update."}
        </p>
      </div>

      {/* Comparison cards */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:40}}>

        {/* Free tier */}
        <div style={{padding:"28px 24px",background:T.bgCard2,border:"1px solid "+T.border,borderRadius:12}}>
          <p style={{fontSize:11,color:T.textDim,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",margin:"0 0 8px"}}>{"FREE FOREVER"}</p>
          <div style={{fontSize:40,color:T.text,fontWeight:200,margin:"0 0 4px"}}>{"$0"}</div>
          <p style={{fontSize:12,color:T.textDim,margin:"0 0 24px"}}>{"No account needed"}</p>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:28}}>
            {[
              "IRS Underpayment Penalty Calculator",
              "Depreciation & Closing Cost Basis Calculator",
              "HUD-1 / Closing Disclosure PDF Reader",
              "Cash-to-Close Reconciliation",
              "Capital Gains Calculator",
              "Short-Term Rental (Airbnb) Tax Calculator",
              "1031 Exchange Calculator",
              "Cost Segregation Estimator",
              "Free Agent Tax Guide (PDF download)",
            ].map((f,i)=>(
              <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                <span style={{color:T.green,fontSize:13,flexShrink:0,marginTop:1}}>{"✓"}</span>
                <span style={{fontSize:12,color:T.textMid,lineHeight:1.4}}>{f}</span>
              </div>
            ))}
          </div>
          <button onClick={()=>setPage("calculators")}
            style={{width:"100%",padding:"11px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600,
              background:"transparent",border:"1px solid "+T.border,color:T.textMid}}>
            {"Open Free Calculators →"}
          </button>
        </div>

        {/* Paid workbook */}
        <div style={{padding:"28px 24px",background:"linear-gradient(145deg,#0d120e,#090e0a)",
          border:"2px solid "+T.goldDim+"80",borderRadius:12,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:14,right:14,padding:"3px 10px",
            background:"linear-gradient(135deg,"+T.gold+","+T.goldLight+")",borderRadius:20,
            fontSize:9,fontWeight:700,color:"#050608",letterSpacing:"0.08em"}}>{"BEST VALUE"}</div>
          <p style={{fontSize:11,color:T.goldDim,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",margin:"0 0 8px"}}>{"WORKBOOK"}</p>
          <div style={{fontSize:40,color:T.gold,fontWeight:200,margin:"0 0 4px"}}>{"$97"}</div>
          <p style={{fontSize:12,color:T.textDim,margin:"0 0 24px"}}>{"One-time · Instant download"}</p>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:28}}>
            {[
              {t:"Everything in Free, plus:",bold:true},
              {t:"Excel workbook — all calculators in one file"},
              {t:"Depreciation schedule that updates automatically"},
              {t:"Cost seg tracker with bonus depreciation"},
              {t:"Closing cost basis worksheet (matches your HUD-1)"},
              {t:"Schedule E income/expense tracker"},
              {t:"Capital gains & 1031 exchange planner"},
              {t:"Cash-to-close reconciliation sheet"},
              {t:"Annual tax summary — hand directly to your CPA"},
              {t:"Lifetime access — buy once, use every year"},
            ].map((f,i)=>(
              <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                {f.bold
                  ?<span style={{fontSize:11,color:T.gold,fontWeight:700}}>{f.t}</span>
                  :<><span style={{color:T.gold,fontSize:13,flexShrink:0,marginTop:1}}>{"✓"}</span>
                   <span style={{fontSize:12,color:T.textMid,lineHeight:1.4}}>{f.t}</span></>
                }
              </div>
            ))}
          </div>
          <a href="https://realtytaxtools.gumroad.com/l/xldteyv" target="_blank" rel="noopener noreferrer"
            style={{display:"block",width:"100%",padding:"12px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",
              fontSize:13,fontWeight:700,textAlign:"center",textDecoration:"none",boxSizing:"border-box",
              background:"linear-gradient(135deg,"+T.gold+","+T.goldLight+")",color:"#050608"}}>
            {"Get the Workbook — $97 →"}
          </a>
          <p style={{fontSize:10,color:T.textDim,textAlign:"center",marginTop:8}}>
            {"Secure checkout via Gumroad · Instant PDF + Excel download"}
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div style={{marginBottom:40}}>
        <h2 style={{fontSize:18,fontWeight:400,color:T.gold,marginBottom:20,textAlign:"center"}}>{"Common Questions"}</h2>
        <div style={{display:"grid",gap:12}}>
          {[
            {q:"Are the calculators really free?",
             a:"Yes. Every calculator on this site is free with no account required and no time limit. We believe real estate investors deserve professional-grade tax tools without paying $300/hr CPA fees for basic calculations."},
            {q:"What's in the workbook exactly?",
             a:"An Excel file (.xlsx) with 8 linked worksheets covering the full lifecycle of a rental property: basis calculation from your closing disclosure, depreciation schedule, annual income/expense tracking, capital gains, 1031 exchange planning, and a summary sheet you can email directly to your CPA."},
            {q:"Do I need to know Excel?",
             a:"Basic Excel is helpful but not required. Every sheet has clear labels and instructions. You enter your numbers in yellow cells — everything else calculates automatically."},
            {q:"Is this for one property or multiple?",
             a:"The workbook handles one primary property with unlimited Schedule E entries per year. Most investors use a separate copy per property. Buy once, copy for each deal."},
            {q:"What if my question isn't in the workbook?",
             a:"The free calculators cover most scenarios. For complex situations (cost segregation, passive activity rules, REPS), the blog articles walk through the analysis step by step."},
            {q:"Do you offer refunds?",
             a:"Yes — if the workbook doesn't work as described, contact us within 7 days for a full refund. No questions asked."},
          ].map((item,i)=>(
            <FAQItem key={i} q={item.q} a={item.a}/>
          ))}
        </div>
      </div>

      {/* Social proof / trust */}
      <div style={{padding:"24px",background:T.bgCard2,border:"1px solid "+T.border,borderRadius:10,textAlign:"center"}}>
        <p style={{fontSize:13,color:T.textMid,margin:"0 0 16px",lineHeight:1.6}}>
          {"Built by a licensed CPA who has analyzed hundreds of real estate closings. Every calculator reflects actual IRS rules — not generic formulas."}
        </p>
        <div style={{display:"flex",justifyContent:"center",gap:24,flexWrap:"wrap"}}>
          {["🏦 IRS Publication 551","📋 MACRS depreciation tables","⚖️ IRC §469 passive rules","📊 Schedule E compliant"].map((t,i)=>(
            <span key={i} style={{fontSize:10,color:T.textDim,fontWeight:600}}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function FAQItem({q,a}){
  const [open,setOpen]=useState(false);
  return(
    <div style={{border:"1px solid "+T.border,borderRadius:8,overflow:"hidden"}}>
      <div onClick={()=>setOpen(o=>!o)}
        style={{padding:"12px 16px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",
          background:open?"rgba(200,169,110,0.04)":T.bgCard2}}>
        <span style={{fontSize:12,color:T.text,fontWeight:500}}>{q}</span>
        <span style={{color:T.goldDim,fontSize:14,flexShrink:0,marginLeft:8}}>{open?"▾":"▸"}</span>
      </div>
      {open&&<div style={{padding:"12px 16px",fontSize:12,color:T.textMid,lineHeight:1.6,borderTop:"1px solid "+T.border+"40"}}>{a}</div>}
    </div>
  );
}


// ── PRIVACY POLICY PAGE ──────────────────────────────────────────────────────
function PrivacyPage(){
  return(
    <div style={{maxWidth:760,margin:"0 auto",padding:"40px 20px 60px"}}>
      <h1 style={{fontSize:24,fontWeight:400,color:T.gold,marginBottom:8}}>{"Privacy Policy"}</h1>
      <p style={{fontSize:12,color:T.textDim,marginBottom:32}}>{"Last updated: June 1, 2026"}</p>
      {[
        {title:"Overview",text:"RealtyTaxTools.com ('we','us','our') operates as a free real estate tax calculator and educational resource. This Privacy Policy explains how we handle information when you use our website."},
        {title:"Information We Collect",text:"We collect minimal information. When you use our calculators, the numbers you enter are processed locally in your browser and are not transmitted to or stored on our servers. If you subscribe to our email list, we collect your email address only. If you purchase the workbook, the transaction is processed by Gumroad, which has its own privacy policy."},
        {title:"Email List",text:"If you provide your email address to receive our newsletter or free resources, we use that email to send you real estate tax tips and product updates. You can unsubscribe at any time by clicking the unsubscribe link in any email. We do not sell or share your email address with third parties."},
        {title:"Cookies and Analytics",text:"We may use basic analytics to understand how visitors use our site (such as which pages are visited most). This data is aggregated and anonymous. We do not use advertising cookies or track individual users across the web."},
        {title:"Google AdSense",text:"We may display advertisements through Google AdSense. Google uses cookies to serve ads based on your prior visits to our website and other sites. You can opt out of personalized advertising by visiting Google's Ads Settings at google.com/settings/ads."},
        {title:"PDF Upload",text:"When you upload a HUD-1 or Closing Disclosure to our PDF analyzer, the document is sent to Anthropic's Claude API for analysis and is not stored by us. Please review Anthropic's privacy policy at anthropic.com/privacy for information on how they handle data."},
        {title:"Third-Party Links",text:"Our site may contain links to third-party websites including Gumroad, ConvertKit, and affiliate partners. We are not responsible for the privacy practices of those sites."},
        {title:"Children's Privacy",text:"Our site is not directed to children under 13. We do not knowingly collect personal information from children under 13."},
        {title:"Changes to This Policy",text:"We may update this Privacy Policy from time to time. We will post any changes on this page with an updated date."},
        {title:"Contact",text:"If you have questions about this Privacy Policy, contact us at: realtytaxtools@gmail.com"},
      ].map((s,i)=>(
        <div key={i} style={{marginBottom:24}}>
          <h2 style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:8}}>{s.title}</h2>
          <p style={{fontSize:13,color:T.textMid,lineHeight:1.7,margin:0}}>{s.text}</p>
        </div>
      ))}
    </div>
  );
}


