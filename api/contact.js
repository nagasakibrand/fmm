// Vercel Serverless Function. Credenciales exclusivamente en variables de entorno.
import nodemailer from 'nodemailer';
const allowedObjectives=new Set(['Rendimiento deportivo','Composición corporal','Información general']);
const hits=new Map();
const escapeHTML=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
function setHeaders(res){res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');}
export default async function handler(req,res){
 setHeaders(res);
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Método no permitido.'});}
 const origin=req.headers.origin;
 const canonical=process.env.PUBLIC_SITE_URL;
 if(origin&&canonical){try{if(new URL(origin).host!==new URL(canonical).host)return res.status(403).json({error:'Origen no autorizado.'});}catch{return res.status(403).json({error:'Origen no válido.'});}}
 const ip=String(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim().slice(0,100);
 const t=Date.now();const prev=(hits.get(ip)||[]).filter(x=>t-x<3_600_000);if(prev.length>=6)return res.status(429).json({error:'Demasiados intentos. Escríbenos directamente por correo.'});prev.push(t);hits.set(ip,prev);
 if(hits.size>2500)hits.clear();
 let data=req.body;
 if(typeof data==='string'){try{data=JSON.parse(data);}catch{return res.status(400).json({error:'Formato de datos no válido.'});}}
 if(!data||typeof data!=='object'||Array.isArray(data))return res.status(400).json({error:'Faltan datos del formulario.'});
 // Honeypot: responder normalmente sin enviar correo.
 if(data.website)return res.status(200).json({ok:true,confirmationSent:true});
 const name=String(data.name||'').trim(),email=String(data.email||'').trim().toLowerCase(),objective=String(data.objective||'').trim(),message=String(data.message||'').trim();
 if(!data.privacy)return res.status(400).json({error:'Debes aceptar la información de privacidad.'});
 if(name.length<2||name.length>100||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)||email.length>180||!allowedObjectives.has(objective)||message.length<10||message.length>2000)return res.status(400).json({error:'Revisa los datos del formulario y vuelve a intentarlo.'});
 const sender=process.env.GMAIL_USER,to=process.env.CONTACT_TO||sender,secret=process.env.GMAIL_APP_PASSWORD?.replaceAll(' ','');
 if(!sender||!secret){console.error('FMM: configuración SMTP pendiente.');return res.status(503).json({error:'El formulario todavía no está activado. Contacta en fmmnutricion98@gmail.com.'});}
 const transporter=nodemailer.createTransport({host:'smtp.gmail.com',port:465,secure:true,auth:{user:sender,pass:secret},connectionTimeout:12000,greetingTimeout:12000,socketTimeout:15000});
 try{
  await transporter.sendMail({from:`FMM Nutrición <${sender}>`,to,replyTo:email,subject:`Nueva consulta FMM · ${objective}`,text:`Nueva consulta desde FMM Nutrición\n\nNombre: ${name}\nCorreo: ${email}\nMotivo: ${objective}\n\nMensaje:\n${message}\n\nEnviado mediante el formulario web.`,html:`<div style="font:15px Arial,sans-serif;max-width:620px;color:#101D3A"><h2>Nueva consulta en FMM Nutrición</h2><p><b>Nombre:</b> ${escapeHTML(name)}</p><p><b>Correo:</b> ${escapeHTML(email)}</p><p><b>Motivo:</b> ${escapeHTML(objective)}</p><p><b>Mensaje:</b></p><div style="white-space:pre-wrap;background:#f2f0e8;padding:15px">${escapeHTML(message)}</div></div>`});
 }catch(err){console.error('FMM notification failed:',err?.message);return res.status(502).json({error:'No hemos podido enviar tu solicitud. Prueba con el correo directo.'});}
 let confirmationSent=true;
 try{
  await transporter.sendMail({from:`FMM Nutrición <${sender}>`,to:email,subject:'Hemos recibido tu consulta · FMM Nutrición',text:`Hola, ${name}:\n\nHemos recibido tu solicitud de información sobre ${objective.toLowerCase()}. Fernando podrá responderte en este correo.\n\nGracias por contactar con FMM Nutrición.\n\nEste mensaje es automático; no contiene asesoramiento nutricional.`,html:`<div style="font:15px Arial,sans-serif;color:#101D3A;max-width:620px"><h1>FMM NUTRICIÓN</h1><p>Hola, ${escapeHTML(name)}:</p><p>Hemos recibido tu solicitud de información sobre <strong>${escapeHTML(objective.toLowerCase())}</strong>.</p><p>Fernando podrá responderte en este mismo correo.</p><p>Gracias por contactar con FMM Nutrición.</p><hr><small>Mensaje automático de confirmación. No incluye consejo médico ni nutricional individual.</small></div>`});
 }catch(err){confirmationSent=false;console.error('FMM confirmation failed:',err?.message);}
 return res.status(200).json({ok:true,confirmationSent});
}
