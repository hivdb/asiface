package edu.stanford.hivdb.asijs;

import java.util.Collection;
import java.util.Map;

import elemental2.core.JsArray;
import jsinterop.base.JsPropertyMap;

public class JsObjectify {

    public final static JsPropertyMap<Object> toJsPropertyMap(Map<?, ?> input) {
        JsPropertyMap<Object> jsmap = JsPropertyMap.of();

        for (Map.Entry<?, ?> entry : input.entrySet()) {
            String key = entry.getKey().toString();
            Object val = toJavascript(entry.getValue());
            jsmap.set(key, val);
        }

        return jsmap;
    }

    public final static JsArray<Object> toJsArray(Collection<?> input) {
        return new JsArray<>(
            input
                .stream()
                .map(val -> toJavascript(val))
                .toArray());
    }

    public final static Object toJavascript(Object input) {
        if (input instanceof Map) {
            return toJsPropertyMap((Map<?, ?>) input);
        } else if (input instanceof Collection) {
            return toJsArray((Collection<?>) input);
        }
        return input;
    }

}
