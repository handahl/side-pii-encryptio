// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import { svelte } from "file:///home/project/node_modules/@sveltejs/vite-plugin-svelte/src/index.js";
import wasm from "file:///home/project/node_modules/vite-plugin-wasm/exports/import.mjs";
import topLevelAwait from "file:///home/project/node_modules/vite-plugin-top-level-await/exports/import.mjs";
var vite_config_default = defineConfig({
  plugins: [
    wasm(),
    topLevelAwait(),
    svelte()
  ],
  optimizeDeps: {
    exclude: ["argon2-browser"]
  },
  server: {
    fs: {
      allow: [".."]
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHsgc3ZlbHRlIH0gZnJvbSAnQHN2ZWx0ZWpzL3ZpdGUtcGx1Z2luLXN2ZWx0ZSdcbmltcG9ydCB3YXNtIGZyb20gJ3ZpdGUtcGx1Z2luLXdhc20nXG5pbXBvcnQgdG9wTGV2ZWxBd2FpdCBmcm9tICd2aXRlLXBsdWdpbi10b3AtbGV2ZWwtYXdhaXQnXG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgd2FzbSgpLFxuICAgIHRvcExldmVsQXdhaXQoKSxcbiAgICBzdmVsdGUoKVxuICBdLFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBleGNsdWRlOiBbJ2FyZ29uMi1icm93c2VyJ11cbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgZnM6IHtcbiAgICAgIGFsbG93OiBbJy4uJ11cbiAgICB9XG4gIH1cbn0pIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF5TixTQUFTLG9CQUFvQjtBQUN0UCxTQUFTLGNBQWM7QUFDdkIsT0FBTyxVQUFVO0FBQ2pCLE9BQU8sbUJBQW1CO0FBRzFCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLEtBQUs7QUFBQSxJQUNMLGNBQWM7QUFBQSxJQUNkLE9BQU87QUFBQSxFQUNUO0FBQUEsRUFDQSxjQUFjO0FBQUEsSUFDWixTQUFTLENBQUMsZ0JBQWdCO0FBQUEsRUFDNUI7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLElBQUk7QUFBQSxNQUNGLE9BQU8sQ0FBQyxJQUFJO0FBQUEsSUFDZDtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
