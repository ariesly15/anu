 import { CurrentOwner } from './CurrentOwner'

 var queue = []
 var callbacks = []

 function setState() {
     if (transaction.isInTransation) {
         console.warn("Cannot update during an existing state transition (such as within `render` or another component's constructor). " +
             "Render methods should be a pure function of props and state; constructor side-effects are an anti-pattern," +
             " but can be moved to `componentWillMount`")
     }
 }


 export var transaction = {
     isInTransation: false,
     enqueueCallback: function(obj) {
         //它们是保证在ComponentDidUpdate后执行
         callbacks.push(obj)
     },
     renderWithoutSetState: function(instance) {
         instance.setState = instance.forceUpdate = setState
         try {
             CurrentOwner.cur = instance
             var vnode = instance.render()
         } finally {
             CurrentOwner.cur = null
             delete instance.setState
             delete instance.forceUpdate
         }
         return vnode
     },
     enqueue: function(obj) {
         if (obj)
             queue.push(obj)
         if (!this.isInTransation) {
             this.isInTransation = true
             var preProcessing = queue.concat()
             var processingCallbacks = callbacks.concat()
             var mainProcessing = []
             queue.length = callbacks.length = 0
             var unique = {}
             preProcessing.forEach(function(request) {
                 try {
                     request.init() //预处理， 合并参数，同一个组件的请求只需某一个进入主调度程序
                     if (!unique[request.component.uuid]) {
                         unique[request.component.uuid] = 1
                         mainProcessing.push(request)
                     }
                 } catch (e) {
                     console.log(e)
                 }

             })

             mainProcessing.forEach(function(request) {
                 try {
                     request.exec() //执行主程序
                 } catch (e) {
                     console.log(e)
                 }
             })
             processingCallbacks.forEach(function(request) {
                 request.cb.call(request.instance)
             })
             this.isInTransation = false
             if (queue.length) {
                 this.enqueue() //用于递归调用自身)
             }
         }
     }
 }