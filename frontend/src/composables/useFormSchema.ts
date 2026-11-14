import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import type { z } from 'zod'

/**
 * Создаёт форму из zod схемы с автоматической генерацией типов и дефолтных значений
 */
export function useFormSchema<T extends z.ZodType<Record<string, any>>>(
  schema: T,
  defaults: z.infer<T>
) {
  type FormData = z.infer<T>
  
  const form = useForm<FormData>({
    validationSchema: toTypedSchema(schema),
    initialValues: defaults as any,
  })
  
  return {
    ...form,
    schema,
  }
}

/**
 * Создаёт форму из zod схемы с пользовательскими начальными значениями
 */
export function useFormSchemaWithValues<T extends z.ZodType<Record<string, any>>>(
  schema: T,
  values: z.infer<T>
) {
  type FormData = z.infer<T>
  
  const form = useForm<FormData>({
    validationSchema: toTypedSchema(schema),
    initialValues: values as any,
  })
  
  return {
    ...form,
    schema,
  }
}
