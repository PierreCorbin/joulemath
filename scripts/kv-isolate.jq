# Turn a Pages project GET body into a PATCH body.
# Production keeps SUBSCRIBERS and EVENTS. Preview loses those two bindings
# and gains SUBSCRIBERS_PREVIEW and EVENTS_PREVIEW. Other bindings and env vars stay.
.result.deployment_configs
| .production.kv_namespaces //= {}
| .production.kv_namespaces.SUBSCRIBERS.namespace_id = $prod_sub
| .production.kv_namespaces.EVENTS.namespace_id = $prod_ev
| .preview.kv_namespaces //= {}
| .preview.kv_namespaces |= (
    del(.SUBSCRIBERS, .EVENTS)
    | .SUBSCRIBERS_PREVIEW.namespace_id = $prev_sub
    | .EVENTS_PREVIEW.namespace_id = $prev_ev
  )
| {deployment_configs: .}
