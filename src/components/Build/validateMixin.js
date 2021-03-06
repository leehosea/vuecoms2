export default {
  methods: {
    formatRule (rule, field) {
      if (!rule) return
      let r = rule
      if (typeof rule === 'string') {
        r = {type: rule, fieldname: field.label}
      } else if (typeof rule === 'function') {
        r = {validate: rule, fieldname: field.label}
      } else {
        r = Object.assign({fieldname: field.label}, rule)
      }
      r._internal = true // 内部规则
      return r
    },

    getRule (field) {
      let rule

      if (!field.rule || field.static || field.hidden) {
        rule = []
      } else {
        if (!Array.isArray(field.rule)) {
          rule = [field.rule]
        } else {
          rule = field.rule
        }
      }

      let new_rule = []
      for(let r of rule) {
        new_rule.push(this.formatRule(r, field))
      }

      // 添加必填校验
      if (field.required) {
        new_rule.splice(0, 0, {required:true, type: 'any', fieldname: field.label})
      }
      return new_rule
    },

    validateRule: async function (value, fieldname, validateResult) {
      let result = validateResult[fieldname]
      if (!result) return
      if (result.rule) {
        result.validateState = 'validating'
    
        let res = await this.$validator.validate(value, {[fieldname]: result.rule}, {[fieldname]: result.field.label})
        if (res) {
          result.validateState = 'error'
          result.error = res[fieldname]
        } else {
          result.validateState = 'success'
          result.error = ''
        }
      }
    }
  }
}

