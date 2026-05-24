
import React, { useState } from 'react';
import { Mail, MapPin, Phone, Send, Instagram, ExternalLink, MessageCircle, Clock } from 'lucide-react';
import { WHATSAPP_PHONE } from '../constants';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const subject = `Nuevo mensaje de contacto de ${formData.name}`;
    const body = `Nombre: ${formData.name}\nEmail: ${formData.email}\n\nMensaje:\n${formData.message}`;
    
    window.location.href = `mailto:inkfluencia@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    setIsSent(true);
    setTimeout(() => {
        setIsSent(false);
        setFormData({ name: '', email: '', message: '' });
    }, 2000);
  };

  const instagramLink = "https://www.instagram.com/inkfluencia_?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==";

  return (
    <div className="min-h-[calc(100vh-80px)] bg-transparent p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
                Hablemos de <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-500">Estilo</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                ¿Tienes una idea personalizada? ¿Dudas sobre tu pedido? ¿O simplemente quieres saludar? Estamos aquí para ti.
            </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* Contact Info & Socials */}
            <div className="space-y-8 animate-fade-in text-left">
                {/* Social Media Card */}
                <div className="bg-gradient-to-br from-purple-600/80 to-indigo-600/80 rounded-3xl p-8 text-white shadow-xl border border-white/20 backdrop-blur-xl transform transition duration-300 hover:scale-[1.02]">
                    <h2 className="text-2xl font-black mb-6 flex items-center gap-2 uppercase tracking-tight">
                        <Instagram className="w-6 h-6 text-pink-400" />
                        Síguenos en Instagram
                    </h2>
                    <p className="text-purple-100 mb-8 leading-relaxed font-medium">
                        Únete a nuestra comunidad visual. Publicamos nuevos diseños, ofertas exclusivas y las mejores fotos de nuestros clientes.
                    </p>
                    <a 
                        href={instagramLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-white text-purple-700 px-6 py-3 rounded-xl font-extrabold hover:bg-purple-50 transition-colors shadow-lg"
                    >
                        Ver Perfil @inkfluencia_
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="liquid-glass p-6 rounded-3xl shadow-sm hover:scale-[1.02] transition-transform text-left">
                        <div className="w-10 h-10 bg-green-100/80 dark:bg-green-950/40 rounded-full flex items-center justify-center text-green-600 dark:text-green-450 mb-4 border border-green-200/20">
                            <MessageCircle className="w-5 h-5" />
                        </div>
                        <h3 className="font-extrabold text-gray-955 dark:text-white mb-1">WhatsApp</h3>
                        <p className="text-xs text-zinc-650 dark:text-gray-400 mb-3 font-bold uppercase tracking-wider">Atención rápida</p>
                        <a 
                            href={`https://wa.me/${WHATSAPP_PHONE}`}
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-green-600 dark:text-green-400 font-extrabold text-sm hover:underline"
                        >
                            +57 320 319 1152
                        </a>
                    </div>

                    <div className="liquid-glass p-6 rounded-3xl shadow-sm hover:scale-[1.02] transition-transform text-left">
                        <div className="w-10 h-10 bg-blue-105/80 dark:bg-blue-955/40 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-450 mb-4 border border-blue-200/20">
                            <Mail className="w-5 h-5" />
                        </div>
                        <h3 className="font-extrabold text-gray-955 dark:text-white mb-1">Email</h3>
                        <p className="text-xs text-zinc-650 dark:text-gray-400 mb-3 font-bold uppercase tracking-wider">Soporte y Ventas</p>
                        <a href="mailto:inkfluencia@gmail.com" className="text-blue-600 dark:text-blue-400 font-extrabold text-sm hover:underline">inkfluencia@gmail.com</a>
                    </div>

                     <div className="liquid-glass p-6 rounded-3xl shadow-sm hover:scale-[1.02] transition-transform text-left">
                        <div className="w-10 h-10 bg-orange-100/80 dark:bg-orange-955/40 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-450 mb-4 border border-orange-200/20">
                            <MapPin className="w-5 h-5" />
                        </div>
                        <h3 className="font-extrabold text-gray-955 dark:text-white mb-1">Ubicación</h3>
                        <p className="text-sm text-zinc-800 dark:text-gray-250 font-medium">Bucaramanga, Colombia</p>
                        <p className="text-[10px] text-zinc-550 dark:text-gray-400 font-bold tracking-wider uppercase mt-1">Envíos a todo el país</p>
                    </div>

                     <div className="liquid-glass p-6 rounded-3xl shadow-sm hover:scale-[1.02] transition-transform text-left">
                        <div className="w-10 h-10 bg-pink-100/80 dark:bg-pink-955/40 rounded-full flex items-center justify-center text-pink-600 dark:text-pink-450 mb-4 border border-pink-200/20">
                            <Clock className="w-5 h-5" />
                        </div>
                        <h3 className="font-extrabold text-gray-955 dark:text-white mb-1">Horario</h3>
                        <p className="text-sm text-zinc-800 dark:text-gray-250 font-medium">Lun - Vie: 9am - 6pm</p>
                        <p className="text-sm text-zinc-800 dark:text-gray-250 font-medium">Sáb: 10am - 2pm</p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="liquid-glass p-8 rounded-3xl shadow-xl text-left">
                <h2 className="text-2xl font-black mb-6 text-gray-950 dark:text-white uppercase tracking-tight">Envíanos un mensaje</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-black uppercase text-pink-500 dark:text-pink-400 mb-2 tracking-wider">Nombre</label>
                        <input 
                            type="text" 
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full p-3 rounded-xl glass-input outline-none font-medium text-zinc-950 dark:text-white"
                            placeholder="Tu nombre"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black uppercase text-pink-500 dark:text-pink-400 mb-2 tracking-wider">Correo Electrónico</label>
                        <input 
                            type="email" 
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="w-full p-3 rounded-xl glass-input outline-none font-medium text-zinc-950 dark:text-white"
                            placeholder="tucorreo@ejemplo.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black uppercase text-pink-500 dark:text-pink-400 mb-2 tracking-wider">Mensaje</label>
                        <textarea 
                            rows={5}
                            required
                            value={formData.message}
                            onChange={(e) => setFormData({...formData, message: e.target.value})}
                            className="w-full p-3 rounded-xl glass-input outline-none font-medium text-zinc-950 dark:text-white"
                            placeholder="¿En qué podemos ayudarte?"
                        />
                    </div>
                    <button 
                        type="submit"
                        disabled={isSent}
                        className="w-full py-4 bg-gradient-to-r from-pink-600 to-orange-500 text-white rounded-xl font-black shadow-lg hover:shadow-orange-500/25 hover:scale-101 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                        {isSent ? 'Enviado con Éxito' : 'Enviar Mensaje'}
                        {!isSent && <Send className="w-5 h-5 animate-pulse" />}
                    </button>
                </form>
            </div>

        </div>
      </div>
    </div>
  );
};
