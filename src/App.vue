<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <!-- <HelloWorld msg="Welcome to Your Vue.js App"/> -->
    <div class="bsn">
      <!-- <uploader :mode="'view'" bsnType="43"></uploader> -->
      <uploader-file></uploader-file>
    </div>
    
  </div>
</template>
<script>
import uploaderFile from './components/UploaderFile.vue';

export default {
  name: 'app',
  components: {
    uploaderFile,
  },
};
</script>

<style lang="less">
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
