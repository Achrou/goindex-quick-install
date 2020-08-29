var clipboard = new ClipboardJS("#copy");

clipboard.on("success", function(e) {
  console.info("Action:", e.action);
  console.info("Text:", e.text);
  console.info("Trigger:", e.trigger);

  e.clearSelection();
});

clipboard.on("error", function(e) {
  console.error("Action:", e.action);
  console.error("Trigger:", e.trigger);
});

var app = new Vue({
  data: {
    loading: false,
    cacheKey: "goindex_options",
    versions: ["2.0.8"],
    remember: false,
    indexConfig: {
      authCode: "",
      siteName: "",
      roots: [
        {
          id: "root",
          name: "",
          user: "",
          pass: ""
        }
      ],
      enable_password_file_verify: false,
      enable_cors_file_down: false
    },
    options: {
      version: "2.0.8",
      languages: "en",
      render: {
        head_md: false,
        readme_md: false,
        desc: false
      }
    },
    result: {
      status: "",
      content: "",
      message: ""
    }
  },
  watch: {
    remember(val) {
      if (!val) {
        localStorage.removeItem(this.cacheKey);
      }
    }
  },
  created() {
    this.getCache();
  },
  computed: {},
  methods: {
    addRoot() {
      this.indexConfig.roots.push({});
    },
    delRoot(index) {
      this.indexConfig.roots.splice(index, 1);
    },
    getCode() {
      this.loading = true;
      let vm = this;
      fetch("/getCode", {
        body: JSON.stringify({
          indexConfig: this.indexConfig,
          options: this.options
        }),
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/json"
        })
      })
        .then(response => response.json())
        .then(function(data) {
          vm.loading = false;
          vm.result = data;
          if (vm.remember) {
            vm.setCache();
          }
        });
    },
    setCache() {
      localStorage.setItem(
        this.cacheKey,
        JSON.stringify({
          indexConfig: { ...this.indexConfig, authCode: "" },
          options: this.options,
          remember: this.remember
        })
      );
    },
    getCache() {
      try {
        let data = localStorage.getItem(this.cacheKey);
        if (data) {
          let options = JSON.parse(data);
          this.options = options.options;
          this.indexConfig = options.indexConfig;
          this.remember = options.remember;
        }
      } catch (e) {
        localStorage.removeItem("goindex_options");
      }
    }
  }
}).$mount("#app");
