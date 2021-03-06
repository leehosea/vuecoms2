<template>
  <div v-if="!removed" class="box" :class="[boxType, headerStyle, boxTheme]">
    <div v-if="title" class="box-header" :class="{'with-border':withBorder}">
      <div class="box-title" :style="{'text-align':headerAlign}">
          <slot name="title"><p><Icon v-if="icon" :type="icon"></Icon>{{title}}</p></slot>
      </div>
      <div class="box-tools pull-right">
        <slot name="tools"></slot>
        <button v-if="collapse" type="button" class="box-tool"
          @click.prevent="toggle"
        >
            <Icon v-if="open" :type="openIcon" class="box-icon"></Icon>
            <Icon v-else :type="closeIcon" class="box-icon"></Icon>
        </button>
        <button v-if="removable" type="button" class="box-tool"
          @click.prevent="removed=true"
        ><Icon type="ios-close" class="box-icon"></Icon></button>
      </div>
    </div>

    <transition
      name="collapse"
      @enter="enter"
      @after-enter="afterEnter"
      @before-leave="beforeLeave"
    >
      <div class="box-body" v-if="open" :style="bodyStyle">
        <slot></slot>
      </div>
    </transition>

    <div v-if="$slots.footer" class="box-footer" :class="{'with-footer-border':withFooterBorder}" :style="{'text-align':footerAlign}">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'box',

  data() {
    return {
      open: true,
      removed: false
    }
  },

  props: {
    title: {
      type: String,
      default: ''
    },

    headerAlign: {
      type: String,
      default: 'left'
    },

    footerAlign: {
      type: String,
      default: 'left'
    },

    withBorder: {
      type: Boolean,
      default: true
    },

    withFooterBorder: {
      type: Boolean,
      default: true
    },

    headerClass: {
      type: String,
      default: ''
    },

    collapse: {
      type: Boolean,
      default: true
    },

    removable: {
      type: Boolean,
      default: false
    },

    icon: {
      type: String,
      default: ''
    },

    openIcon: {
      type: String,
      default: 'ios-add'
    },

    closeIcon: {
      type: String,
      default: 'ios-remove'
    },

    height: {
    },

    theme: {
      type: String,
      default: '' // 目前只支持 card 和 ''
    }
  },

  computed: {
    headerStyle () {
      if (this.headerClass)
        return `box-${this.headerClass}`
      else
        return ''
    },

    bodyStyle () {
      if (this.height) {
        if (typeof this.height === 'number') {
          return {height: `${this.height}px`, overflow: 'auto'}
        } else {
          return {height: this.height, overflow: 'auto'}
        }
      }
    },

    boxTheme () {
      if (this.theme === 'default')
        return
      if (this.theme) {
        return `box-theme-${this.theme}`
      }
    }
  },

  methods: {
    toggle () {
      this.open = !this.open
    },

    enter (el) {
      el.style.height = 'auto'
      var endWidth = getComputedStyle(el).height
      el.style.height = '0px'
      el.offsetHeight // force repaint
      el.style.height = endWidth;
    },

    afterEnter (el) {
      el.style.height = 'auto'
    },

    beforeLeave (el) {
      el.style.height = getComputedStyle(el).height
      el.offsetHeight // force repaint
      el.style.height = '0px'
    },

  }
}
</script>

<style>
.box {
    position: relative;
    border-radius: 3px;
    background: #ffffff;
    border-top: 3px solid #d2d6de;
    margin-bottom: 20px;
    width: 100%;
    box-shadow: 0 1px 1px rgba(0,0,0,0.4)
}

.box.box-primary {
    border-top-color: #3c8dbc
}

.box.box-info {
    border-top-color: #00c0ef
}

.box.box-danger {
    border-top-color: #dd4b39
}

.box.box-warning {
    border-top-color: #f39c12
}

.box.box-success {
    border-top-color: #00a65a
}

.box.box-default {
    border-top-color: #d2d6de
}

.box.collapsed-box .box-body,.box.collapsed-box .box-footer {
    display: none
}

.box.box-solid {
    border-top: 0
}

.box.box-solid>.box-header .btn.btn-default {
    background: transparent
}

.box.box-solid>.box-header .btn:hover,.box.box-solid>.box-header a:hover {
    background: rgba(0,0,0,0.1)
}

.box.box-solid.box-default {
    border: 1px solid #d2d6de
}

.box.box-solid.box-default>.box-header {
    color: #444;
    background: #d2d6de;
    background-color: #d2d6de
}

.box.box-solid.box-default>.box-header a,.box.box-solid.box-default>.box-header .btn {
    color: #444
}

.box.box-solid.box-primary {
    border: 1px solid #3c8dbc
}

.box.box-solid.box-primary>.box-header {
    color: #fff;
    background: #3c8dbc;
    background-color: #3c8dbc
}

.box.box-solid.box-primary>.box-header a,.box.box-solid.box-primary>.box-header .btn {
    color: #fff
}

.box.box-solid.box-info {
    border: 1px solid #00c0ef
}

.box.box-solid.box-info>.box-header {
    color: #fff;
    background: #00c0ef;
    background-color: #00c0ef
}

.box.box-solid.box-info>.box-header a,.box.box-solid.box-info>.box-header .btn {
    color: #fff
}

.box.box-solid.box-danger {
    border: 1px solid #dd4b39
}

.box.box-solid.box-danger>.box-header {
    color: #fff;
    background: #dd4b39;
    background-color: #dd4b39
}

.box.box-solid.box-danger>.box-header a,.box.box-solid.box-danger>.box-header .btn {
    color: #fff
}

.box.box-solid.box-warning {
    border: 1px solid #f39c12
}

.box.box-solid.box-warning>.box-header {
    color: #fff;
    background: #f39c12;
    background-color: #f39c12
}

.box.box-solid.box-warning>.box-header a,.box.box-solid.box-warning>.box-header .btn {
    color: #fff
}

.box.box-solid.box-success {
    border: 1px solid #00a65a
}

.box.box-solid.box-success>.box-header {
    color: #fff;
    background: #00a65a;
    background-color: #00a65a
}

.box.box-solid.box-success>.box-header a,.box.box-solid.box-success>.box-header .btn {
    color: #fff
}

.box.box-solid>.box-header>.box-tools {
    border: 0;
    box-shadow: none
}

.box.box-solid[class*='bg']>.box-header {
    color: #fff
}

.box .box-group>.box {
    margin-bottom: 5px
}

.box .knob-label {
    text-align: center;
    color: #333;
    font-weight: 100;
    font-size: 12px;
    margin-bottom: 0.3em
}

.box>.overlay,.overlay-wrapper>.overlay,.box>.loading-img,.overlay-wrapper>.loading-img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%
}

.box .overlay,.overlay-wrapper .overlay {
    z-index: 50;
    background: rgba(255,255,255,0.7);
    border-radius: 3px
}

.box .overlay>.fa,.overlay-wrapper .overlay>.fa {
    position: absolute;
    top: 50%;
    left: 50%;
    margin-left: -15px;
    margin-top: -15px;
    color: #000;
    font-size: 30px
}

.box .overlay.dark,.overlay-wrapper .overlay.dark {
    background: rgba(0,0,0,0.5)
}

.box-header:before,.box-body:before,.box-footer:before,.box-header:after,.box-body:after,.box-footer:after {
    content: " ";
    display: block;
}

.box-header:after,.box-body:after,.box-footer:after {
    clear: both
}

.box-header {
    color: #444;
    display: block;
    padding: 10px;
    position: relative
}

.box-header.with-border {
    border-bottom: 1px solid #f4f4f4
}

.box-footer.with-footer-border {
    border-top: 1px solid #f4f4f4
}

.collapsed-box .box-header.with-border {
    border-bottom: none
}

.box-header>.fa,.box-header>.glyphicon,.box-header>.ion,.box-header .box-title > p {
    display: inline-block;
    font-size: 18px;
    margin: 0!important;
    line-height: 1;
    font-weight: bold;
}

.box-header>.fa,.box-header>.glyphicon,.box-header>.ion {
    margin-right: 5px
}

.box-header>.box-tools {
    position: absolute;
    right: 10px;
    top: 5px
}

.box-header>.box-tools [data-toggle="tooltip"] {
    position: relative
}

.box-header>.box-tools.pull-right .dropdown-menu {
    right: 0;
    left: auto
}

.box-header>.box-tools .dropdown-menu>li>a {
    color: #444!important
}

.box-tool {
    padding: 5px;
    font-size: 12px;
    background: transparent;
    color: #97a0b3;
    box-shadow: none;
    border: 1px solid transparent;
    cursor: pointer;
}

.box-tool:focus {
    outline:0;
}

.open .box-tool,.box-tool:hover {
    color: #606c84
}

.box-tool:active {
    box-shadow: none
}

.box-body {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    border-bottom-right-radius: 3px;
    border-bottom-left-radius: 3px;
    padding: 10px
}

.no-header .box-body {
    border-top-right-radius: 3px;
    border-top-left-radius: 3px
}

.box-body>.table {
    margin-bottom: 0
}

.box-body .fc {
    margin-top: 5px
}

.box-body .full-width-chart {
    margin: -19px
}

.box-body.no-padding .full-width-chart {
    margin: -9px
}

.box-body .box-pane {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    border-bottom-left-radius: 3px
}

.box-body .box-pane-right {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    border-bottom-right-radius: 3px;
    border-bottom-left-radius: 0
}

.box-footer {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    border-bottom-right-radius: 3px;
    border-bottom-left-radius: 3px;
    padding: 10px;
    background-color: #fff
}

.chart-legend {
    margin: 10px 0
}

@media (max-width: 991px) {
    .chart-legend>li {
        float:left;
        margin-right: 10px
    }
}

.box-comments {
    background: #f7f7f7
}

.box-comments .box-comment {
    padding: 8px 0;
    border-bottom: 1px solid #eee
}

.box-comments .box-comment:before,.box-comments .box-comment:after {
    content: " ";
    display: table
}

.box-comments .box-comment:after {
    clear: both
}

.box-comments .box-comment:last-of-type {
    border-bottom: 0
}

.box-comments .box-comment:first-of-type {
    padding-top: 0
}

.box-comments .box-comment img {
    float: left
}

.box-comments .comment-text {
    margin-left: 40px;
    color: #555
}

.box-comments .username {
    color: #444;
    display: block;
    font-weight: 600
}

.box-comments .text-muted {
    font-weight: 400;
    font-size: 12px
}

.collapse-enter-active,
.collapse-leave-active {
  transition: all .2s ease;
  overflow: hidden;
}
.collapse-enter,
.collapse-leave-active {

}

.box-icon {
    font-size: 25px;
}

.box.box-theme-card {
    border: 1px solid #dcdee2;
    border-color: #e8eaec;
    box-shadow: none;
}

.box.box-theme-simple {
  border: none;
  box-shadow: none;
}
.box.box-theme-simple .box-header.with-border {
  border-bottom: none;
}

.box.box-theme-simple .box-header .box-title > p {
  border-left: 5px solid #1a1a1a;
  padding-left: 15px;
}
.box.box-primary.box-theme-simple .box-header .box-title > p {
  border-left: 5px solid #3c8dbc;
}
.box.box-info.box-theme-simple .box-header .box-title > p {
  border-left: 5px solid #00c0ef;
}
.box.box-danger.box-theme-simple .box-header .box-title > p {
  border-left: 5px solid #dd4b39;
}
.box.box-warning.box-theme-simple .box-header .box-title > p {
  border-left: 5px solid #f39c12;
}
.box.box-success.box-theme-simple .box-header .box-title > p {
  border-left: 5px solid #00a65a;
}
.box.box-default.box-theme-simple .box-header .box-title > p {
  border-left: 5px solid #1a1a1a;
}
</style>
