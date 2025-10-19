<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="close"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
      <h2 class="text-xl font-bold mb-4 dark:text-white">
        {{ t("manualConnect.title") }}
      </h2>

      <div class="mb-4">
        <label class="block text-sm font-medium mb-2 dark:text-gray-300">
          {{ t("manualConnect.ipAddress") }}
        </label>
        <input
          v-model="ipAddress"
          type="text"
          placeholder="192.168.1.100"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
          @keyup.enter="connect"
        />
      </div>

      <div class="mb-6">
        <label class="block text-sm font-medium mb-2 dark:text-gray-300">
          {{ t("manualConnect.port") }}
        </label>
        <input
          v-model.number="port"
          type="number"
          placeholder="53317"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
          @keyup.enter="connect"
        />
      </div>

      <div v-if="error" class="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md text-sm">
        {{ error }}
      </div>

      <div class="flex gap-3">
        <button
          @click="connect"
          :disabled="!ipAddress || connecting"
          class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          {{ connecting ? t("manualConnect.connecting") : t("manualConnect.connect") }}
        </button>
        <button
          @click="close"
          :disabled="connecting"
          class="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          {{ t("manualConnect.cancel") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();

const show = defineModel<boolean>("show", { default: false });

const emit = defineEmits<{
  connect: [ip: string, port: number];
}>();

const ipAddress = ref("");
const port = ref(53317);
const error = ref("");
const connecting = ref(false);

const connect = () => {
  if (!ipAddress.value) {
    error.value = t("manualConnect.errorNoIp");
    return;
  }

  // Basic IP validation
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipRegex.test(ipAddress.value)) {
    error.value = t("manualConnect.errorInvalidIp");
    return;
  }

  error.value = "";
  connecting.value = true;
  emit("connect", ipAddress.value, port.value);
};

const close = () => {
  if (!connecting.value) {
    show.value = false;
    error.value = "";
  }
};

// Reset connecting state when dialog is opened/closed
watch(show, (newShow) => {
  if (!newShow) {
    connecting.value = false;
    error.value = "";
  } else {
    // Reset form when opening
    ipAddress.value = "";
    port.value = 53317;
  }
});
</script>
