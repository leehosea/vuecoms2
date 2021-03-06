<template>
  <div class="u-build">
    <div slot="header" class="u-build-header"></div>

    <div class="u-build-body">
      <template v-if="theme === 'default'">
        <template v-for="(item, index) in current">
          <component
            v-if="!item.hidden"
            :key="index"
            :is="item.component || 'uSection'"
            v-bind="item"
            :boxComponent="showBox ? item.boxComponent : ''"
            :boxOptions="getBoxOptions(item)"
            :value="value"
            :labelWidth="item.labelWidth || labelWidth"
            :labelDir="item.labelDir || labelDir"
            :staticSuffix="staticSuffix"
            :validateResult="validateResult"
            :ref="item.name"
          ></component>
        </template>
      </template>
      <template v-if="theme === 'tab'">
        <Tabs value="section_1">
          <TabPane
            v-for="(item, index) of current"
            :label="item.title"
            :name="`section_${index + 1}`"
            :key="index"
          >
            <component
              v-if="!item.hidden"
              :is="item.component || 'uSection'"
              v-bind="item"
              :boxComponent="showBox ? item.boxComponent : ''"
              :boxOptions="getBoxOptions(item)"
              :value="value"
              :labelWidth="item.labelWidth || labelWidth"
              :labelDir="item.labelDir || labelDir"
              :labelAlign="item.labelAlign || labelAlign"
              :staticSuffix="staticSuffix"
              :validateResult="validateResult"
              :ref="item.name"
            ></component>
          </TabPane>
        </Tabs>
      </template>
    </div>

    <div slot="footer" class="u-build-header"></div>

    <Row v-if="buttons" ref = 'buttons' slot="buttons" class="u-build-buttons">
      <Buttons
        :buttons="buttonList"
        :data="value"
        :size="btnSize"
        :target="this"
      ></Buttons>
    </Row>
  </div>
</template>

<script>
import validateMixin from "./validateMixin";
import { deepCompare, deepCopy, isEmpty } from "../utils/utils";
import dict from "../mixins/dict";
import Buttons from "../Table/UButtons";

export default {
  name: "Build",
  mixins: [dict, validateMixin],
  components: { Buttons },
  data() {
    return {
      originValue: deepCopy(this.value), // 保留初始值，用于reset
      oldvalue: deepCopy(this.value, true),
      current: deepCopy(this.data),
      fields: {},
      btns: {}, // 保存按钮数据
      rows: {}, // 每段索引,key为每段name值，如果没有则不插入
      validating: false,
      validateResult: {}, //保存校验结果,
      watchers: {}, // 保存根据状态生成的$watch结果，用于清除
      convertFields: {} // 存在数据预处理的字段列表
    };
  },
  provide () {
    return {managerElement: this}
  },
  props: {
    theme: {
      type: String,
      default: "default"
    },
    showBox: {
      type: Boolean,
      default: true
    },
    data: {
      type: Array,
      default: () => []
    },

    // 数据字典，可以用ref来引用，当field为字符串时，直接就是ref引用
    datadict: {
      type: Object,
      default: () => {}
    },

    labelWidth: {
      type: Number,
      default: 150
    },

    staticSuffix: {
      type: String,
      default: "_static"
    },

    value: {
      // 数据存放对象
      type: Object,
      default: () => {
        return {};
      }
    },

    //用于后台校验返回的信息，形式为
    //{name: '错误描述'}
    errors: {
      type: Object,
      default() {
        return {};
      }
    },

    rules: {
      type: Object,
      default() {
        return {};
      }
    },

    // 用于选择控件设置choices
    choices: {
      type: Object,
      default() {
        return {};
      }
    },

    buttons: {},
    labelDir: {
      type: String,
      default: "horizontal"
    },
    labelAlign: {
      type: String,
      default: "right"
    },
    boxOptions: {
      type: Object,
      default() {
        return {};
      }
    },
    // 状态对象，用于实现根据状态来改变field的hidden, static, required
    // 它的格式为： {name: function()}
    statusObject: {
      type: Object,
      default() {
        return {};
      }
    }
  },

  computed: {
    buttonList() {
      if (Array.isArray(this.buttons)) return this.buttons;
      else return this.buttons.items;
    },

    btnSize() {
      return this.buttons.size || "default";
    }
  },

  methods: {
    /** 校验处理
     * options 原来是callback，现在可以支持对象或 callback 函数
     * 如果是对象，则可以在其中定义 callback 回调，fields 表示要校验的字段列表
     */
    async validate(options={}) {
      let error = "";
      let validateRules = {};
      let callback
      let fields = null
      if (typeof options === 'function') {
        callback = options
      } else {
        callback = options.callback
        fields = options.fields
      }
      this.clearValidateResult(null, '', fields);
      for (let k of Object.keys(this.validateResult)) {
        let field = this.fields[k];
        // 增加对是否校验字符列表的检查，如果存在，且不在列表中，则不校验
        if (fields && fields.indexOf(k) === -1) continue
        let v = this.validateResult[k];
        if (field && !field.static && !field.hidden) {
          // 如果children为对象或数组，则合成object或array的校验规则模式
          if (v.children) {
            if (Array.isArray(v.children) && v.children.length > 0) {
              let rules = {};
              for (let c of Object.keys(v.children[0])) {
                rules[c] = v.children[0][c].rule;
              }
              let new_rule = {
                type: "array",
                items: { type: "object", props: rules }
              };
              for (let r of v.rule) {
                if (r.type === "array") {
                  Object.assign(new_rule, r.rule);
                }
                if (r.required) new_rule.required = true;
                if (r.validate) new_rule.validate = r.validate;
              }
              validateRules[k] = new_rule;
            } else if (typeof v.children === "function") {
              validateRules[k] = {
                validate: v.children,
                fieldname: field.label
              };
            } else if (v.children instanceof Object) {
              let rules = {};
              for (let c of Object.keys(v.children)) {
                rules[c] = v.children[c].rule;
              }
              validateRules[k] = { type: "object", props: rules };
            }
          } else {
            if (v.rule && v.rule.length > 0) validateRules[k] = v.rule;
          }
        }
      }

      let res = await this.$validator.validate(this.value, validateRules);

      if (res) {
        for (let k of Object.keys(res)) {
          let v = res[k]; // 出错结果
          let validateResult = this.validateResult[k]; // 校验结果
          if (Array.isArray(v)) {
            for (let i = 0, _len = v.length; i < _len; i++) {
              let r = v[i];
              if (r instanceof Object) {
                for (let k1 of Object.keys(r)) {
                  let c_r = r[k1];
                  this.setValidateResultKey(
                    validateResult.children[i],
                    k1,
                    c_r
                  );
                  if (c_r && !error) {
                    error = c_r;
                  }
                }
              }
            }
          } else if (v instanceof Object) {
            for (let k1 of Object.keys(v)) {
              let c_r = v[k1];
              this.setValidateResultKey(validateResult.children, k1, c_r);
              if (c_r && !error) {
                error = c_r;
              }
            }
          } else {
            this.setValidateResultKey(this.validateResult, k, v);
            if (v && !error) {
              error = v;
            }
          }
        }
      }

      if (callback) callback(error);

      if (error) throw error;
    },

    setValidateResultKey(result, name, err, flag = "success") {
      if (err) {
        this.$set(result[name], "validateState", "error");
        this.$set(result[name], "error", err);
      } else {
        this.$set(result[name], "validateState", flag);
        this.$set(result[name], "error", "");
      }
    },

    //生成校验结构
    //force表示是否强制
    makeValidateResult() {
      for (let name of Object.keys(this.fields)) {
        // let field = this.fields[name]
        // if (!this.validateResult[name] && !field.static || (this.validateResult[name] && (field.static || !field.requried))) {
        this.setFieldRule(name);
        // }
      }
    },

    // 设置某个字段的校验规则，先清除直接设置的规则，然后根据field, rules来重构规则列表，再将未清除掉的规则放在最后面
    // 当字段有static, hidden时，不生成规则
    setFieldRule(name) {
      let field = this.fields[name];
      let rule = this.getRule(field);
      let e_rule = this.formatRule(this.rules[name], field);
      if (e_rule) {
        if (Array.isArray(e_rule)) {
          rule = rule.concat(e_rule);
        } else {
          rule.push(e_rule);
        }
      }
      let children;
      if (this.validateResult[name]) {
        children = this.validateResult[name].children;
      }

      if (rule.length === 0) {
        rule = [];
      }
      // 如果存在原来的规则，则清除，但要保留用户直接设置的规则
      this.$set(this.validateResult, name, {
        error: "",
        validateState: "",
        rule,
        field,
        fullfield: field.label,
        children
      });
    },

    /** 清除校验结果
     * 如果传入了 fields，则只清除 fields 中的数据，否则无 fields 时，全部清除
     */
    clearValidateResult(validateResult, flag = "", fields) {
      if (!validateResult) validateResult = this.validateResult;
      for (let k of Object.keys(validateResult)) {
        if (fields && fields.indexOf(k) === -1) continue
        this.setValidateResultKey(validateResult, k, "", flag);
        let r = validateResult[k];
        if (r.children) {
          if (Array.isArray(r.children)) {
            for (let r1 of r.children) {
              this.clearValidateResult(r1, flag);
            }
          } else if (r.children instanceof Object) {
            this.clearValidateResult(r.children, flag);
          }
        }
      }
    },

    getBoxOptions(item) {
      return Object.assign({}, this.boxOptions, item.boxOptions || {});
    },

    //校验某个字段的校验结果，适用于直接改value的情况
    validateField(name) {
      let field = this.fields[name];
      // if (!field.hidden || field.static) return
      this.validateRule(this.value, name, this.validateResult);
    },

    findDataDict(name, field = {}) {
      let f = this.datadict[name];
      if (!f) throw new Error(`Can't found field ${field} in datadict.`);
      return Object.assign({}, f, field);
    },

    clearWatchers() {
      for (let w in this.watchers) {
        this.watchers[w].watcher();
      }
      this.watchers = {};
    },

    addWatch(name, field, type) {
      let item;
      let watchFunc;
      if (type === "when") {
        if (
          !Array.isArray(name) ||
          name.length !== 2 ||
          (typeof name[0] !== "string" && typeof name[0] !== "function")
        )
          throw new Error(
            `Watch object definition is not right, you should provide and Array like [name|function, function]`
          );
        if (typeof name[0] === "string") {
          watchFunc = this.statusObject[name[0]];
          if (!watchFunc)
            throw new Error(
              `No status object name ${name[0]} defined for field ${field.label}(${field.name})`
            );
        } else {
          watchFunc = name[0];
        }
        item = { name: field.name, type: "when", callback: name[1] };
        name = name[0];
      } else {
        watchFunc = this.statusObject[name];
        if (!watchFunc)
          throw new Error(
            `No status object name ${name} defined for field ${field.label}(${field.name})`
          );
        item = { name: field.name, type };
      }
      if (!this.watchers[name])
        this.watchers[name] = {
          items: [],
          watcher: null,
          func: watchFunc
        };
      this.watchers[name].items.push(item);
    },

    initWatchers() {
      for (let name in this.watchers) {
        let item = this.watchers[name];
        let watcher = this.$watch(
          item.func,
          (newVal, oldVal) => {
            for (let c of item.items) {
              let field = this.fields[c.name];
              switch (c.type) {
                case "hidden":
                  this.$set(field, "hidden", !newVal);
                  break;
                case "static":
                case "required":
                  this.$set(field, c.type, newVal);
                  break;
                case "when":
                  if (c.callback) c.callback(newVal, field, this.value);
              }
            }
          },
          {
            immediate: true,
            deep: true
          }
        );
        item.watcher = watcher;
      }
    },

    makeFields() {
      // 清除监听缓存
      this.clearWatchers();

      let fs = {};
      for (let row of this.current) {
        let isStatic = row.static === undefined ? false : row.static;
        if (row.name) {
          this.rows[row.name] = row;
        }
        // 增加layout的缺省处理
        let default_layout;
        if (!row.layout || (row.layout && row.layout.length === 0)) {
          default_layout = [];
        }
        let row_fields = [];
        for (let field of row.fields || []) {
          if (typeof field === "string") {
            field = this.findDataDict(field);
          } else {
            if (field.ref) field = this.findDataDict(field.ref, field);
          }
          fs[field.name] = field;
          row_fields.push(field);
          if (field.static === undefined) this.$set(field, "static", isStatic);
          if (field.hidden === undefined) this.$set(field, "hidden", false);
          if (field.enableOnChange === undefined)
            this.$set(field, "enableOnChange", false); // 禁止Input确发onChange回调
          if (field.options === undefined) this.$set(field, "options", {});
          // if (field.options.choices === undefined) this.$set(field.options, 'choices', [])
          if (field.type === undefined) this.$set(field, "type", "str"); //str
          // 增加watch支持
          if (field.showWhen) this.addWatch(field.showWhen, field, "hidden");
          if (field.staticWhen)
            this.addWatch(field.staticWhen, field, "static");
          if (field.requiredWhen)
            this.addWatch(field.requiredWhen, field, "required");
          // 增加通用监时的处理
          if (field.when) this.addWatch(field.when, field, "when");
          if (default_layout) {
            default_layout.push([field.name]);
          }

          // 处理有转换函数的字段
          if (field.inputConvert || field.outputConvert || field.mapConvert) {
            this.convertFields[field.name] = field;
          }
        }
        row.fields = row_fields;
        if (default_layout) this.$set(row, "layout", default_layout);
      }
      this.fields = fs;
      this.initWatchers();
    },

    mergeErrors(errors) {
      for (let k in this.errors) {
        this.$set(this.validateResult[k], "error", this.errors[k]);
        this.$set(this.validateResult[k], "validateState", "error");
      }
    },

    setChoices(name, choices) {
      let field = this.fields[name];
      if (!field.options) {
        this.$set(field, "options", { choices, type: "select" });
      } else {
        this.$set(field.options, "choices", choices);
      }
    },

    // 合并rules
    // mergeRules () {
    //   for(let k in this.rules) {
    //     let result = this.validateResult[k]
    //     let v = this.rules[k]
    //     if (!result) continue
    //     if (Array.isArray(v)) {
    //       result.rule = result.rule.concat(v)
    //     } else {
    //       result.rule.push(v)
    //     }
    //     // this.validateRules[k] = result.rule
    //   }
    // },

    // 清空数据
    reset() {
      let v = deepCopy(this.originValue);
      this.reset_object(this.value);
      Object.assign(this.value, v);
      this.$nextTick(() => {
        this.clearValidateResult();
      });
      // this.makeValidateResult(true)
      // this.mergeRules()
    },

    // 数据准备，可以根据某些规则进行数据加工
    // 支持两种模式
    // 1. 函数，执行后对字段值进行替换 (value, field, alldata)
    // 2. 对象，收集对应的字段值生成新的对象并替换原字段值
    processInputConvert(v) {
      for (let key in this.convertFields) {
        let f = this.convertFields[key]
        if (typeof f.inputConvert === "function") {
          v[key] = f.inputConvert(v[key], f, v);
        } else if (f.mapConvert instanceof Object) {
          v[key] = {};
          for (let k in f.mapConvert) {
            v[key][k] = v[f.mapConvert[k]];
          }
        } else {
          throw new Error(
            `Not support this format of inputConvert or mapConvert ${f}`
          );
        }
      }
      return v;
    },

    // 数据输出，可以根据规则输出字段内容
    // v 是目标对象， source 是原数据对象
    processOutputConvert(v, source) {
      for (let key in this.convertFields) {
        let f = this.convertFields[key]
        if (typeof f.outputConvert === "function") {
          v[key] = f.outputConvert(source[key], f, source);
        } else if (
          f.mapConvert instanceof Object &&
          source[key] instanceof Object
        ) {
          for (let k in f.mapConvert) {
            v[f.mapConvert[k]] = source[key][k];
          }
        } else {
          throw new Error(
            `Not support this format of inputConvert or mapConvert ${f}`
          );
        }
      }
    },

    getData() {
      // 如果字段设置了keep为false，则字段不输出
      let v = deepCopy(this.oldvalue, (k, v) => {
        return this.fields[k] && this.fields[k].keep === false;
      });
      this.processOutputConvert(v, this.oldvalue);
      return v;
    }

    // setData (v) {
    //   let r = this.processInputConvert(v)
    //   for (let k in r) {
    //     this.$set(this.value, k, r[k])
    //   }
    // }
  },

  created() {
    this.makeFields();
    this.makeValidateResult();
    // this.mergeRules()
    this.mergeErrors();
  },

  watch: {
    value: {
      handler(newvalue) {
        let n = deepCopy(newvalue, true);
        let v = deepCompare(n, this.oldvalue, true);
        if (!isEmpty(v)) {
          this.oldvalue = n;
          this.$emit("input", n);
          for (let k in v) {
            let field = this.fields[k];
            if (field && field.onChange) {
              field.onChange(v[k].value, newvalue);
            }
          }
        }
      },
      deep: true
    },
    errors: {
      handler() {
        this.mergeErrors();
      },
      deep: true
    },

    choices: {
      immediate: true,
      handler() {
        for (let row of this.current) {
          for (let field of row.fields || []) {
            let choices = this.choices[field.name];
            if (choices) {
              if (!field.options) {
                this.$set(field, "options", { choices: choices });
              } else {
                this.$set(field.options, "choices", choices);
              }
            }
          }
        }
      },
      deep: true
    },

    data: {
      handler(newdata) {
        this.current = deepCopy(newdata);
        this.makeFields();
        this.makeValidateResult();
        // this.mergeRules()
      },
      deep: true
    },

    fields: {
      handler(val) {
        this.makeValidateResult();
      },
      deep: true
    }
    // rules: {
    //   handler () {
    //     this.mergeRules()
    //   },
    //   deep: true
    // }
  }
};
</script>
