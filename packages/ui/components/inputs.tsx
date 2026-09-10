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
  Icono?: React.ComponentType<{ className?: string }> | null;
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


  return (
    <View className={`flex flex-col gap-1 w-full text-left ${className}`}>
      {label && (
        <Text style={fuente("medium")} className="text-xs text-stone-600 select-none">
          {label}
        </Text>
      )}
      <View className="flex flex-row items-center bg-[#FCF8F4] border border-[#E8DEC1]/60 rounded-xl px-3 h-fit focus-within:border-[#DAA520] transition-colors gap-3 w-full">
        {Icono && (
          <Icono className="text-stone-700 w-5 h-5 flex-shrink-0" />
        )}
        <TextInput
          style={fuente()}
          // Ocultar solo si es campo de password Y el ojo no lo revelo.
          // Estaba como `secureTextEntry={showPassword}`, invertido: el valor
          // inicial `false` mostraba la contrasena en claro.
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize={autoCapitalize}
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
            className="text-stone-500 hover:text-stone-700 flex-shrink-0 outline-none cursor-pointer"
          >
            <EyeIcon className="w-5 h-5" />
          </Pressable>
        )}
      </View>
    </View>
  );
}
