<template>
  <Head></Head>
  <div class="container">
    <div :ref="elDom" class="home-info">
      <div>hello {{ version }}</div>
      <ElButton type="info" @click="toAbout">关于</ElButton>
      <ElButton type="info" @click="toElectron">打开Electron</ElButton>
      <ElButton type="info" @click="test">弹个框</ElButton>
      <ElButton type="info" @click="generate_snowflake">生成雪花算法id</ElButton>
      <ElButton type="info" @click="updateTest">检查更新</ElButton>
      <ElButton type="danger" @click="rebootApp">重启app</ElButton>
      <ElRow>开机自启:</ElRow>
      <ElRow :gutter="20">
        <ElCol :span="6">
          <ElSwitch v-model="auto" active-text="开启" inactive-text="关闭" @change="launchSwitch"></ElSwitch>
        </ElCol>
      </ElRow>
      <ElRow>打包路径:</ElRow>
      <ElRow :gutter="20">
        <ElCol :span="6">
          <ElButton type="info" @click="platformPath">platform路径</ElButton>
        </ElCol>
        <ElCol :span="6">
          <ElButton type="info" @click="externPath">extern路径</ElButton>
        </ElCol>
        <ElCol :span="6">
          <ElButton type="info" @click="insidePath">inside路径</ElButton>
        </ElCol>
        <ElCol :span="6">
          <ElButton type="info" @click="rootPath">root路径</ElButton>
        </ElCol>
      </ElRow>
      <ElRow>快捷键:</ElRow>
      <ElRow :gutter="20">
        <ElCol :span="12">
          <!-- <HotkeyInput v-model="shortcutStr"></HotkeyInput> -->
          <HotkeyInput :multiple="true" :max="4" v-model="shortcutStr"></HotkeyInput>
        </ElCol>
      </ElRow>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IpcRendererEvent } from 'electron';
import { onMounted, onUnmounted, ref, unref, watch } from 'vue';
import customize from '@/renderer/store/customize';
import {
  windowCreate,
  windowShow,
  windowMessageOn,
  windowMessageRemove,
  windowBlurFocusOn
} from '@/renderer/common/window';

import { menuShow, menuOn, menuListenersRemove } from '@/renderer/common/additional/menu';
import { ElButton, ElRow, ElCol, ElSwitch, ElNotification, ElMessage } from 'element-plus';
import { snowflake } from '@/lib/util/snowflake';

import { getRootPath, getInsidePath, getExternPath, getPlatformPath, relaunch, launch, getGlobal } from '@/renderer/common';

import HotkeyInput from '@/renderer/views/components/hotkeyInput-vue3/index.vue';
import Head from "@/renderer/views/components/head/index.vue";

import {
  shortcutOn,
  shortcut,
  unShortcutAll,
  unShortcut,
  shortcutGetByKey
} from '@/renderer/common/enhance/shortcut';


const version = await getGlobal('app.version')

let auto = ref(false);

let shortcutStr = ref();
let shortcutId = ref();
/**
    * 右键menu作用域
    */
function elDom(element: HTMLElement) {
  if (!element) return;
  element.oncontextmenu = () => {
    menuShow();
  };
}

/**
 * 右键menu事件监听
 */
menuOn((event, args) => {
  windowCreate({
    customize: {
      title: '右键测试',
      route: '/message',
      parentId: customize.get().id,
      data: { text: args }
    },
    modal: true
  });
});

windowMessageOn('communication', (event: IpcRendererEvent, args: any) => {
  //监听弹框测试
  console.log(args);
});



function test() {
  windowCreate({
    customize: {
      title: '弹框测试',
      route: '/message',
      data: { text: 'wdnmd' },
      parentId: customize.get().id
    },
    modal: true
  });
}

function updateTest() {
  windowCreate({
    customize: {
      id: 0,
      title: '更新测试',
      route: '/update',
      // parentId: customize.get().id
    },
    // modal: true,
    width: 300,
    height: 300
  });
}

function toAbout() {
  windowCreate({
    customize: {
      title: '关于',
      route: '/about',
      isMainWin: true
    },
    width: 300,
    height: 300,
    resizable: true
  });
}

function toElectron() {
  windowCreate({
    customize: {
      id: 0,
      url: 'https://electronjs.org'
    },
    width: 800,
    height: 600
  });
}



async function generate_snowflake() {
  ElNotification({
    title: '雪花算法',
    message: new snowflake(1n, 2n).nextId().toString(),
    position: 'bottom-right'
  });
}

async function launchSwitch(params: any) {
  ElMessage.success(
    '成功,当前状态已经切换到' + (launch(params) ? '开启' : '关闭')
  );
}

async function platformPath() {
  ElNotification.success(await getPlatformPath('t.txt'));
}

async function externPath() {
  ElNotification.success(await getExternPath('t.txt'));
}

async function insidePath() {
  ElNotification.success(await getInsidePath('t.txt'));
}

async function rootPath() {
  ElNotification.success(await getRootPath('t.txt'));
}


async function rebootApp() {
  if (await getGlobal('app.isPackaged')) {
    relaunch(true);
  } else {
    ElMessage.warning('dev 模式无法进行该操作');
  }
}

watch(shortcutStr, async (newSId, oldSID) => {
  if (typeof unref(shortcutStr) === "string") {
    if (!newSId) {
      unShortcut((await shortcutGetByKey(oldSID))?.id);
      return;
    }
    if (oldSID) {
      unShortcut((await shortcutGetByKey(oldSID))?.id);
    }
    shortcutId.value = await shortcut(shortcutStr.value);
  } else {
    if (!shortcutStr.value || shortcutStr.value?.size === 0) {
      unShortcutAll();
      return
    }
    shortcutId.value = await shortcut(Array.from(shortcutStr.value));
  }
  shortcutOn(shortcutId.value, (e, key) => {
    ElMessage.success(`快捷键回调:${key}`);
  });
}, {
  deep: true
});


windowBlurFocusOn(async (_, args) => {
  if (args === 'blur') {
    unShortcutAll();
  } else {
    if (typeof unref(shortcutStr) === "string" || typeof unref(shortcutStr) === "undefined") {
      if (shortcutId.value) {
        shortcutId.value = await shortcut(shortcutStr.value);
        shortcutOn(shortcutId.value, (e, key) => {
          ElMessage.success(`快捷键回调:${key}`);
        });
      }
    } else {
      if (shortcutStr.value?.size !== 0) {
        shortcutId.value = await shortcut(Array.from(shortcutStr.value));
        shortcutOn(shortcutId.value, (e, key) => {
          ElMessage.success(`快捷键回调:${key}`);
        });
      }
    }
  }
});

onMounted(async () => {
  windowShow();
  auto.value = launch()
});

onUnmounted(() => {
  windowMessageRemove('test'); //关闭监听
  menuListenersRemove(); //关闭右键菜单监听
});

</script>

<style lang='scss' scoped>
@import "./scss/index";
</style>
