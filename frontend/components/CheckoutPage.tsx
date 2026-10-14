import React, { useEffect, useMemo, useState } from 'react';
import { useOutletContext, Link, useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Loader2, Lock, ShieldCheck, MapPin, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { ShippingDetails, ShopOutletContext } from '../types';
import { useAuth } from '../context/AuthContext';
import { APP_IMAGES } from '../imagenes_url';
import { formatPrice } from '../utils/format';

type Field = keyof ShippingDetails;
type Errors = Partial<Record<Field, string>>;

const CONTACT_FIELDS: Field[] = ['email', 'phone', 'fullName'];
const ADDRESS_FIELDS: Field[] = ['street', 'exteriorNumber', 'colonia', 'zipCode', 'city', 'state'];

const validate = (data: ShippingDetails, fields: Field[]): Errors => {
  const errors: Errors = {};
  fields.forEach((f) => {
    if (!String(data[f] ?? '').trim()) errors[f] = 'Campo obligatorio';
  });
  if (fields.includes('email') && data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email.trim())) errors.email = 'Correo no válido';
  if (fields.includes('phone') && data.phone && data.phone.replace(/\D/g, '').length !== 10) errors.phone = 'Debe tener 10 dígitos';
  if (fields.includes('zipCode') && data.zipCode && !/^\d{5}$/.test(data.zipCode.trim())) errors.zipCode = 'Debe tener 5 dígitos';
  return errors;
};

const inputClass = (error?: string) =>
  `w-full bg-gray-50 border p-3 text-base md:text-sm focus:outline-none focus:ring-1 transition-colors rounded-sm ${
    error ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-black focus:ring-black'
  }`;

type FieldProps = {
  name: Field;
  label: string;
  value: string;
  error?: string;
  onChange: (name: Field, value: string) => void;
  onBlur: (name: Field) => void;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onBlur' | 'name' | 'value'>;

const FormField: React.FC<FieldProps> = ({ name, label, value, error, onChange, onBlur, className = '', ...rest }) => (
  <div className={`space-y-1 ${className}`}>
    <label htmlFor={name} className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</label>
    <input
      id={name}
      name={name}
      value={value}
      onChange={(e) => onChange(name, e.target.value)}
      onBlur={() => onBlur(name)}
      aria-invalid={!!error}
      className={inputClass(error)}
      {...rest}
    />
    {error && <p className="text-[11px] text-red-500 animate-fade-in">{error}</p>}
  </div>
);

const CheckoutPage: React.FC = () => {
  const { cartItems, handleCheckout, isCheckingOut, products } = useOutletContext<ShopOutletContext>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const paymentFailed = new URLSearchParams(location.search).get('status') === 'failure';
  const [step, setStep] = useState<1 | 2>(1);

  const [formData, setFormData] = useState<ShippingDetails>({
    fullName: '', email: '', phone: '', street: '', exteriorNumber: '', interiorNumber: '',
    betweenStreets: '', colonia: '', city: '', state: '', zipCode: '',
  });
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [showErrorsFor, setShowErrorsFor] = useState<Field[]>([]);

  useEffect(() => {
    if (cartItems.length === 0 && !paymentFailed) navigate('/shop');
  }, [cartItems.length, navigate, paymentFailed]);

  // Prellenado con la cuenta del cliente.
  useEffect(() => {
    if (!user || user.isAnonymous) return;
    setFormData((prev) => ({
      ...prev,
      fullName: prev.fullName || user.displayName || '',
      email: prev.email || user.email || '',
      phone: prev.phone || user.phoneNumber?.replace(/^\+52/, '') || '',
    }));
  }, [user]);

  const priceOf = (id: string, fallback: number) => products.find((p) => p.id === id)?.price ?? fallback;
  const subtotal = cartItems.reduce((acc, item) => acc + priceOf(item.id, item.price) * item.quantity, 0);
  const shipping = 0;
  const total = subtotal + shipping;

  const errors = useMemo(() => validate(formData, [...CONTACT_FIELDS, ...ADDRESS_FIELDS]), [formData]);
  const errorFor = (f: Field) => (touched[f] || showErrorsFor.includes(f) ? errors[f] : undefined);

  const handleChange = (name: Field, value: string) => {
    let v = value;
    if (name === 'zipCode') v = value.replace(/\D/g, '').slice(0, 5);
    if (name === 'phone') v = value.replace(/[^\d\s+-]/g, '').slice(0, 15);
    setFormData((prev) => ({ ...prev, [name]: v }));
  };
  const handleBlur = (name: Field) => setTouched((prev) => ({ ...prev, [name]: true }));
  const fieldProps = (name: Field) => ({ name, value: String(formData[name] ?? ''), error: errorFor(name), onChange: handleChange, onBlur: handleBlur });

  const firstErrorIn = (fields: Field[]) => fields.find((f) => errors[f]);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setShowErrorsFor(CONTACT_FIELDS);
    const bad = firstErrorIn(CONTACT_FIELDS);
    if (bad) {
      document.getElementById(bad)?.focus();
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitOrder = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isCheckingOut) return;
    setShowErrorsFor([...CONTACT_FIELDS, ...ADDRESS_FIELDS]);
    if (firstErrorIn(CONTACT_FIELDS)) {
      setStep(1);
      return;
    }
    const bad = firstErrorIn(ADDRESS_FIELDS);
    if (bad) {
      document.getElementById(bad)?.focus();
      return;
    }
    handleCheckout({ ...formData, phone: formData.phone.replace(/\D/g, '') });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans pb-20">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 py-4 px-6 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="w-24 block" aria-label="DREAMLIFE, ir al inicio">
            <img src={APP_IMAGES.logo} alt="DREAMLIFE" className="w-full h-auto filter invert brightness-0" />
          </Link>

          <div className="hidden md:flex items-center gap-4 text-xs font-bold uppercase tracking-widest">
            <span className="text-black flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[9px]">1</span>
              Carrito
            </span>
            <div className="w-8 h-[1px] bg-black"></div>
            <span className="flex items-center gap-2 text-black">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] transition-colors ${step > 1 ? 'bg-green-600 text-white' : 'bg-black text-white'}`}>
                {step > 1 ? <CheckCircle size={12} /> : 2}
              </span>
              Identificación
            </span>
            <div className={`w-8 h-[1px] transition-colors duration-500 ${step === 2 ? 'bg-black' : 'bg-gray-300'}`}></div>
            <span className={`flex items-center gap-2 transition-colors ${step === 2 ? 'text-black' : 'text-gray-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] transition-colors ${step === 2 ? 'bg-black text-white' : 'border border-gray-300'}`}>3</span>
              Entrega
            </span>
            <div className="w-8 h-[1px] bg-gray-300"></div>
            <span className="text-gray-400">Pago</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-green-600">
            <Lock size={12} /> PAGO SEGURO
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          {paymentFailed && (
            <div role="alert" className="flex gap-3 bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg text-sm animate-fade-in">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p>El pago no se completó y no se hizo ningún cargo. Puedes intentarlo de nuevo con otro método.</p>
            </div>
          )}

          {step === 2 && (
            <button onClick={() => setStep(1)} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black mb-4">
              <ArrowLeft size={14} /> Volver a Identificación
            </button>
          )}

          {/* Step 1 */}
          <div className={`bg-white p-8 rounded-lg shadow-sm border border-gray-100 transition-opacity duration-300 ${step === 2 ? 'opacity-50' : 'opacity-100'}`}>
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold uppercase tracking-wide flex items-center gap-2">
                <User size={18} /> Datos de Contacto
              </h2>
              {step === 2 && (
                <button onClick={() => setStep(1)} className="flex items-center gap-2 text-xs text-gray-500 hover:text-black underline">
                  <CheckCircle className="text-green-500" size={18} /> Editar
                </button>
              )}
            </div>

            {step === 1 ? (
              <form onSubmit={handleNextStep} noValidate className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField {...fieldProps('email')} label="Correo Electrónico" type="email" autoComplete="email" inputMode="email" placeholder="ejemplo@correo.com" />
                  <FormField {...fieldProps('phone')} label="Teléfono" type="tel" autoComplete="tel-national" inputMode="tel" placeholder="10 dígitos" />
                </div>
                <FormField {...fieldProps('fullName')} label="Nombre Completo" autoComplete="name" placeholder="Nombre y Apellidos" />

                <button type="submit" className="w-full md:w-auto bg-black text-white px-8 py-3 mt-4 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors rounded-sm">
                  Continuar a Entrega
                </button>
              </form>
            ) : (
              <p className="text-sm text-gray-600">
                {formData.fullName} · {formData.email} · {formData.phone}
              </p>
            )}
          </div>

          {/* Step 2 */}
          <div className={`bg-white p-8 rounded-lg shadow-sm border border-gray-100 transition-opacity duration-300 ${step === 1 ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold uppercase tracking-wide flex items-center gap-2">
                <MapPin size={18} /> Dirección de Entrega
              </h2>
              <span className="text-[10px] text-gray-400 uppercase tracking-widest">Paso 2/3</span>
            </div>

            {step === 2 && (
              <form id="step2-form" onSubmit={handleSubmitOrder} noValidate className="space-y-4 animate-fade-in-up">
                <div className="grid grid-cols-12 gap-4">
                  <FormField {...fieldProps('street')} label="Calle" autoComplete="address-line1" placeholder="Nombre de la calle" className="col-span-12 md:col-span-6" />
                  <FormField {...fieldProps('exteriorNumber')} label="No. Exterior" placeholder="123" className="col-span-6 md:col-span-3" />
                  <FormField {...fieldProps('interiorNumber')} label="No. Interior" placeholder="(Opcional)" className="col-span-6 md:col-span-3" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField {...fieldProps('colonia')} label="Colonia" placeholder="Colonia" />
                  <FormField {...fieldProps('zipCode')} label="Código Postal" autoComplete="postal-code" inputMode="numeric" placeholder="Ej: 44966" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField {...fieldProps('city')} label="Ciudad / Municipio" autoComplete="address-level2" placeholder="Ciudad" />
                  <FormField {...fieldProps('state')} label="Estado" autoComplete="address-level1" placeholder="Estado" />
                </div>

                <FormField {...fieldProps('betweenStreets')} label="Entre Calles" placeholder="Ej: Entre Reforma y Juárez (opcional)" />
              </form>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-1 bg-white p-8 rounded-lg shadow-sm border border-gray-100 space-y-6 lg:sticky lg:top-24 lg:self-start">
          {cartItems.map((item) => (
            <div key={item.cartId} className="flex gap-3">
              <div className="w-16 h-20 bg-gray-100 rounded-sm overflow-hidden flex-shrink-0">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold uppercase leading-tight">{item.name}</h4>
                <p className="text-[10px] text-gray-500 mt-1">{item.selectedSize} | {item.selectedColor}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[10px] font-mono text-gray-500">Cant: {item.quantity}</span>
                  <span className="text-xs font-bold">{formatPrice(priceOf(item.id, item.price) * item.quantity)}</span>
                </div>
              </div>
            </div>
          ))}

          <div className="border-t border-gray-100 pt-4 space-y-2 mb-6">
            <div className="flex justify-between text-xs text-gray-500 uppercase">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 uppercase">
              <span>Envío</span>
              <span className="text-green-600 font-bold">GRATIS</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-black border-t border-gray-100 pt-4 mt-2">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          <button
            type={step === 2 ? 'submit' : 'button'}
            form={step === 2 ? 'step2-form' : undefined}
            disabled={isCheckingOut || step === 1}
            className={`w-full py-4 text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 rounded-sm transition-all ${
              step === 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : isCheckingOut
                  ? 'bg-gray-800 text-white cursor-wait'
                  : 'bg-black text-white hover:bg-gray-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
            }`}
          >
            {isCheckingOut ? (
              <><Loader2 size={16} className="animate-spin" /> PROCESANDO...</>
            ) : (
              <>PAGAR AHORA <ChevronRight size={16} /></>
            )}
          </button>

          <div className="mt-4 flex flex-col gap-2 items-center text-[9px] text-gray-400 uppercase tracking-widest text-center">
            <div className="flex gap-2">
              <ShieldCheck size={12} /> Pago procesado por Mercado Pago
            </div>
            <p>Tus datos viajan cifrados. Pagas en el sitio seguro de Mercado Pago.</p>
          </div>

          <div className="mt-6 border-t border-gray-100 pt-6">
            <div className="flex flex-wrap justify-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4 object-contain" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-4 object-contain" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo.svg" alt="Amex" className="h-4 object-contain" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/6/66/Oxxo_Logo.svg" alt="Oxxo" className="h-4 object-contain" />
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/shop')}
              className="text-[10px] text-red-500 hover:text-red-700 font-bold uppercase tracking-widest flex items-center justify-center gap-2 mx-auto transition-colors"
            >
              <XCircle size={14} /> Cancelar y Volver a la Tienda
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
