import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'requireEmailOrPhone', async: false })
export class RequireEmailOrPhoneConstraint
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments) {
    const obj = args.object as any;
    
    // Check if email exists and is valid
    const hasEmail =
      obj.email !== undefined &&
      obj.email !== null &&
      obj.email !== '' &&
      typeof obj.email === 'string' &&
      obj.email.trim().length > 0;
    
    // Check if phone_number exists and is valid
    const hasPhone =
      obj.phone_number !== undefined &&
      obj.phone_number !== null &&
      obj.phone_number !== '' &&
      typeof obj.phone_number === 'string' &&
      obj.phone_number.trim().length > 0;
    
    // At least one must be provided
    const isValid = hasEmail || hasPhone;
    
    return isValid;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Either email or phone_number must be provided';
  }
}

export function RequireEmailOrPhone(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'requireEmailOrPhone',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: RequireEmailOrPhoneConstraint,
    });
  };
}

