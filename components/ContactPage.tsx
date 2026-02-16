
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
    // Simulate sending email
    setIsSent(true);
    setTimeout(() => {
        setIsSent(false);
        setFormData({ name: '', email: '', message: '' });
        alert("¡Mensaje enviado! Nos pondremos en contacto contigo pronto.");
    }, 2000);
  };

  const instagramLink = "https://www.instagram.com/inkfluencia_?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==";

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50 dark:bg-black p-6">
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
            <div className="space-y-8 animate-fade-in">
                {/* Social Media Card */}
                <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-3xl p-8 text-white shadow-xl transform transition hover:scale-[1.02]">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <Instagram className="w-6 h-6" />
                        Síguenos en Instagram
                    </h2>
                    <p className="text-purple-100 mb-8 leading-relaxed">
                        Únete a nuestra comunidad visual. Publicamos nuevos diseños, ofertas exclusivas y las mejores fotos de nuestros clientes.
                    </p>
                    <a 
                        href={instagramLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-white text-purple-600 px-6 py-3 rounded-xl font-bold hover:bg-purple-50 transition-colors shadow-lg"
                    >
                        Ver Perfil @inkfluencia_
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 mb-4">
                            <MessageCircle className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white mb-1">WhatsApp</h3>
                        <p className="text-sm text-gray-500 mb-3">Atención rápida</p>
                        <a 
                            href={`https://wa.me/${WHATSAPP_PHONE}`}
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-green-600 font-bold text-sm hover:underline"
                        >
                            +57 320 319 1152
                        </a>
                    </div>

                    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 mb-4">
                            <Mail className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white mb-1">Email</h3>
                        <p className="text-sm text-gray-500 mb-3">Soporte y Ventas</p>
                        <a href="mailto:hola@inkfluencia.com" className="text-blue-600 font-bold text-sm hover:underline">hola@inkfluencia.com</a>
                    </div>

                     <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 mb-4">
                            <MapPin className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white mb-1">Ubicación</h3>
                        <p className="text-sm text-gray-500">Bucaramanga, Colombia</p>
                        <p className="text-xs text-gray-400">Envíos a todo el país</p>
                    </div>

                     <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center text-pink-600 mb-4">
                            <Clock className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white mb-1">Horario</h3>
                        <p className="text-sm text-gray-500">Lun - Vie: 9am - 6pm</p>
                        <p className="text-sm text-gray-500">Sáb: 10am - 2pm</p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800">
                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Envíanos un mensaje</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Nombre</label>
                        <input 
                            type="text" 
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                            placeholder="Tu nombre"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Correo Electrónico</label>
                        <input 
                            type="email" 
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                            placeholder="tucorreo@ejemplo.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Mensaje</label>
                        <textarea 
                            rows={5}
                            required
                            value={formData.message}
                            onChange={(e) => setFormData({...formData, message: e.target.value})}
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                            placeholder="¿En qué podemos ayudarte?"
                        />
                    </div>
                    <button 
                        type="submit"
                        disabled={isSent}
                        className="w-full py-4 bg-gradient-to-r from-pink-600 to-orange-500 text-white rounded-xl font-bold shadow-lg hover:shadow-orange-500/25 transition-all flex items-center justify-center gap-2"
                    >
                        {isSent ? 'Enviado con Éxito' : 'Enviar Mensaje'}
                        {!isSent && <Send className="w-5 h-5" />}
                    </button>
                </form>
            </div>

        </div>
      </div>
    </div>
  );
};
