/** @jsxImportSource nativewind */
import { useState } from "react";
import { EyeIcon } from "../icons/AuthIcons";
import { fuente } from "../fonts";
import {View,Text, Pressable,TextInput} from 'react-native';


/**
 * Props explicitas en vez de `InputHTMLAttributes<HTMLInputElement>`: esa
 * interfaz trae ~300 props del DOM que despues se spreadean sobre el
 * `TextInput` de React Native, que no las entiende. Ver `button.tsx`.
 */
interface InputProps {
  placeholder?: string;
  Icono?: React.ComponentType<{ className?: string; size?: number; color?: string }> | null;
  label?: string;
  type?:
    | 'none'
    | 'URL'
    | 'addressCity'
    | 'addressCityAndState'
    | 'addressState'
    | 'countryName'
    | 'creditCardNumber'
    | 'creditCardExpiration'
    | 'creditCardExpirationMonth'
    | 'creditCardExpirationYear'
    | 'creditCardSecurityCode'
    | 'creditCardType'
    | 'creditCardName'
    | 'creditCardGivenName'
    | 'creditCardMiddleName'
    | 'creditCardFamilyName'
    | 'emailAddress'
    | 'familyName'
    | 'fullStreetAddress'
    | 'givenName'
    | 'jobTitle'
    | 'location'
    | 'middleName'
    | 'name'
    | 'namePrefix'
    | 'nameSuffix'
    | 'nickname'
    | 'organizationName'
    | 'postalCode'
    | 'streetAddressLine1'
    | 'streetAddressLine2'
    | 'sublocality'
    | 'telephoneNumber'
    | 'username'
    | 'password'
    | 'newPassword'
    | 'oneTimeCode'
    | 'birthdate'
    | 'birthdateDay'
    | 'birthdateMonth'
    | 'birthdateYear'
    | 'cellularEID'
    | 'cellularIMEI'
    | 'dateTime'
    | 'flightNumber'
    | 'shipmentTrackingNumber'
    | undefined;
  name?: string,
  autoCapitalize?:"none"|"sentences"|"words"|"characters";
  onChangeText:(text:string)=>void;

  /** Valor controlado del campo. */
  value?: string;

  /** Clases Tailwind extra para el contenedor. */
  className?: string;

  /** Permite escribir. `false` deja el campo en solo lectura. */
  editable?: boolean;

  /**
   * Solo semantica: ni `TextInput` de RN ni este componente validan por su
   * cuenta. La validacion real la hace el formulario que lo usa.
   */
  required?: boolean;
}

export function Input({
  placeholder,
  Icono,
  label,
  type = 'none',
  name,
  className = "",
  autoCapitalize,
  onChangeText,
  value,
  editable,
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  // Lo que el <input type="email"> original hacia solo: teclado de correo y
  // sin mayuscula automatica (en iOS "Tu@..." rompia el login). En web,
  // react-native-web traduce este keyboardType de vuelta a type="email".
  const isEmail = type === "emailAddress";
  // `focus-within:` y `hover:` son CSS: en nativo no existen. Con estado el
  // borde dorado al enfocar y el ojo mas oscuro al pasar el mouse se ven igual
  // en las dos plataformas (el hover solo se dispara donde hay mouse).
  const [enfocado, setEnfocado] = useState(false);
  const [ojoEnHover, setOjoEnHover] = useState(false);


  return (
    <View className={`flex flex-col gap-1 w-full text-left ${className}`}>
      {label && (
        <Text style={fuente("medium")} className="text-xs text-stone-600 select-none">
          {label}
        </Text>
      )}
      <View className={`flex flex-row items-center bg-[#FCF8F4] border ${enfocado ? "border-[#DAA520]" : "border-[#E8DEC1]/60"} rounded-xl px-3 h-fit transition-colors gap-3 w-full`}>
        {/* Tamaño y color por props: el className de un Svg no llega al DOM
            en web (su cssInterop es `target: false`). 20px = el w-5 h-5 del
            original, #44403C = text-stone-700. */}
        {Icono && (
          <Icono size={20} color="#44403C" className="flex-shrink-0" />
        )}
        <TextInput
          style={fuente()}
          onFocus={() => setEnfocado(true)}
          onBlur={() => setEnfocado(false)}
          placeholderTextColor="#A8A29E"
          // Ocultar solo si es campo de password Y el ojo no lo revelo.
          // Estaba como `secureTextEntry={showPassword}`, invertido: el valor
          // inicial `false` mostraba la contrasena en claro.
          secureTextEntry={isPassword && !showPassword}
          keyboardType={isEmail ? "email-address" : "default"}
          autoCapitalize={autoCapitalize ?? (isEmail ? "none" : undefined)}
          textContentType={isPassword ? 'password' : type}
          placeholder={placeholder}
          onChangeText={onChangeText}
          value={value}
          editable={editable}
          className="flex-1 bg-transparent text-stone-800 text-xs  placeholder-stone-400 outline-none w-full py-1"
        />
        {isPassword && (
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            onHoverIn={() => setOjoEnHover(true)}
            onHoverOut={() => setOjoEnHover(false)}
            className="flex-shrink-0 outline-none cursor-pointer"
          >
            {/* text-stone-500, y text-stone-700 en hover, como el original. */}
            <EyeIcon size={20} color={ojoEnHover ? "#44403C" : "#78716C"} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
