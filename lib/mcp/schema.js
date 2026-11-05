// Minimal JSON Schema checker for MCP tool inputs.
//
// Supports the subset our tool schemas use: type, required, properties,
// additionalProperties:false, enum, const, minimum/maximum, minLength/maxLength,
// pattern, items, minItems/maxItems. No dependency, runs anywhere (Node, Edge,
// Deno). Returns a list of human-readable errors — empty means valid.

function typeOf(v) {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'array'
  if (Number.isInteger(v)) return 'integer'
  return typeof v
}

function typeMatches(expected, v) {
  const t = typeOf(v)
  if (expected === 'number') return t === 'number' || t === 'integer'
  return expected === t
}

export function validate(schema, value, path = 'arguments') {
  const errors = []
  if (!schema) return errors

  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type]
    if (!types.some(t => typeMatches(t, value))) {
      errors.push(`${path} must be ${types.join(' | ')}, got ${typeOf(value)}`)
      return errors
    }
  }
  if ('const' in schema && value !== schema.const) {
    errors.push(`${path} must be ${JSON.stringify(schema.const)}`)
  }
  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${path} must be one of: ${schema.enum.join(', ')}`)
  }
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) errors.push(`${path} must be >= ${schema.minimum}`)
    if (schema.maximum !== undefined && value > schema.maximum) errors.push(`${path} must be <= ${schema.maximum}`)
  }
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) errors.push(`${path} must be at least ${schema.minLength} chars`)
    if (schema.maxLength !== undefined && value.length > schema.maxLength) errors.push(`${path} must be at most ${schema.maxLength} chars`)
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) errors.push(`${path} must match ${schema.pattern}`)
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(`${path} needs at least ${schema.minItems} items`)
    if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push(`${path} allows at most ${schema.maxItems} items`)
    if (schema.items) value.forEach((item, i) => errors.push(...validate(schema.items, item, `${path}[${i}]`)))
  }
  if (typeOf(value) === 'object') {
    const props = schema.properties || {}
    for (const key of schema.required || []) {
      if (value[key] === undefined) errors.push(`${path}.${key} is required`)
    }
    for (const [key, v] of Object.entries(value)) {
      if (props[key]) errors.push(...validate(props[key], v, `${path}.${key}`))
      else if (schema.additionalProperties === false) errors.push(`${path}.${key} is not a known field`)
    }
  }
  return errors
}
