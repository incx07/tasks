const TasksCreateModal = {
    delimiters: ['[[', ']]'],
    components: {
        'input-stepper': InputStepper,
    },
    props: ['locations', 'runtimes'],
    data() {
        return this.initial_state()
    },
    watch: {
    },
    mounted() {
        $('#task_modal_parallel').closest('div.custom-input').hide();
        const vm = this;
        $("#CreateTaskModal").on("hide.bs.modal", function (e) {
            const form = document.getElementById('form');
            Object.assign(vm.$data, vm.initial_state());
            form.classList.remove('was-validated');
        });
    },
    computed: {
         test_parameters() {
            // return ParamsTable.Manager("CreateTaskModal_test_params")
            return ''
        },
        isValidDA() {
             return this.isSubmitted && !this.previewFile;
        },
    },
    methods: {
        initial_state() {
            return {
                task_name: null,
                runtime: null,
                task_handler: null,
                location: 'default',
                cpu_quota: 1,
                memory_quota: 4,
                cloud_settings: {},
                timeout: 5,
                isLoading: false,
                previewFile: null,
                file: null,
                error: {},
                isSubmitted: false,
                parallel_runners: 1,
            }
        },
        get_data() {
            return {
                 "task_name": this.task_name,
                 "parallel_runners": this.parallel_runners,
                 "task_package": this.previewFile,
                 "runtime": this.runtime,
                 "task_handler": this.task_handler,
                 "engine_location": this.location,
                 "cpu_cores": this.cpu_quota,
                 "memory": this.memory_quota,
                 "timeout": this.timeout,
                 "task_parameters": this.test_parameters.get()
            }
        },
        uploadFile(e) {
            const file =  e.target.files[0];
            this.previewFile = file.name
            this.file = file
            return file
        },
        onDrop(e) {
            const file =  e.dataTransfer.files[0];
            this.previewFile = file.name
            this.file = file
            return file
        },
        async createTask(data){
            const resp = await fetch(`/api/v1/tasks/tasks/${getSelectedProjectId()}`,{
                method: 'POST',
                body: data,
            })
            return resp.json()
        },
        removeFile() {
            this.previewFile = null;
            this.file = null;
        },
        saveTask() {
            const form = document.getElementById('form');
            if (!this.isSubmitted) {
                form.classList.add('was-validated');
            }
            this.isSubmitted = true;
            if (form.checkValidity() === true) {
                this.isLoading = true;
                let data = new FormData();
                data.append('data', JSON.stringify(this.get_data()));
                this.createTask(data).then(response => {
                    if (response[0]?.type === "assertion_error") {
                        throw new Error(response[0].msg)
                    }
                }).then(() => {
                    data.append('file',this.file);
                    this.createTask(data).then( response => {
                        showNotify('SUCCESS', 'Task Created.');
                        this.$emit('update-tasks-list', response.task_id);
                        $('#CreateTaskModal').modal('hide');
                    })
                }).catch(err => {
                    showNotify('ERROR', err);
                }).finally(() => {
                    this.isLoading = false;
                })
            }
        },
    },
    template: `
        <div class="modal modal-base fixed-left fade shadow-sm" tabindex="-1" role="dialog" id="CreateTaskModal" xmlns="http://www.w3.org/1999/html">
            <div class="modal-dialog modal-dialog-aside" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="row w-100">
                            <div class="col">
                                <h2>Create task</h2>
                            </div>
                            <div class="col-xs d-flex">
                                <button type="button" class="btn  btn-secondary mr-2" data-dismiss="modal" aria-label="Close">
                                    Cancel
                                </button>
                                <button type="button" 
                                    class="btn btn-basic d-flex align-items-center"
                                    @click="saveTask"
                                >Save<i v-if="isLoading" class="preview-loader__white ml-2"></i></button>
                            </div>
                        </div>
                    </div>
                    <div class="modal-body">
                        <div class="section">
                            <form class="needs-validation needs-validation__custom d-grid grid-column-2 gap-50" id="form" novalidate>
                                <div class="form-group">
                                    <p class="font-h5 font-bold">Task Name</p>
                                    <p class="font-h6 font-weight-400">Enter name that describes the purpose of your function</p>
                                    <div class="custom-input mb-3 mt-2">
                                        <input type="text"
                                            class="form-control"
                                            required
                                            placeholder="Task Name"
                                            v-model='task_name'>
                                    </div>
                                
                                    <p class="font-h5 font-bold">Task Package</p>
                                    <p class="font-h6 font-weight-400">Upload .zip or .jar file with the code and any dependencies.</p>
                                    <div id="dragDropArea" 
                                        class="drop-area mb-3 mt-2" 
                                        :class="{'drop-area__invalid': isValidDA }"
                                        @dragover.prevent @drop.stop.prevent="onDrop">
                                          <input type="file" id="dropInput" multiple accept="*" @change="uploadFile">
                                          <label for="dropInput" class="mb-0 d-flex align-items-center justify-content-center">Drag & drop file or <span>&nbsp;browse</span></label>
                                    </div>
                                    <span v-show="previewFile" class="preview-area_item"> 
                                        [[previewFile]]
                                        <i class="icon__16x16 icon-close__16" @click="removeFile"></i>
                                    </span>
                                </div>
                                <div class="form-group">
                                    <p class="font-h5 font-bold">Runtime</p>
                                    <p class="font-h6 font-weight-400">Choose the language to use to write your function</p>
                                    <div class=" w-100-imp">
                                        <select class="selectpicker bootstrap-select__need-validation mb-3 mt-2" 
                                            id="CreateTaskFields"
                                            data-style="btn"
                                            required
                                            v-model="runtime"
                                            >
                                            <option v-for="runtime in runtimes">
                                                [[runtime]]
                                            </option>
                                        </select>
                                    </div>
                                    <p class="font-h5 font-bold">Task Handler</p>
                                    <p class="font-h6 font-weight-400">Function used to invoke a task</p>
                                    <div class="custom-input mb-3 mt-2">
                                        <input 
                                            id="CreateTaskFields"
                                            type="text"
                                            required
                                            v-model="task_handler" 
                                            class="form-control"
                                            placeholder="Handler name (e.g. lambda.handler)">
                                    </div>
                                </div>
                            </form>
                            <Locations 
                                v-model:location="location"
                                v-model:cpu="cpu_quota"
                                v-model:memory="memory_quota"
                                v-model:parallel_runners="parallel_runners"
                                v-model:cloud_settings="cloud_settings"
                                v-bind="locations"
                                >
                            </Locations>
                            <slot></slot>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
}
