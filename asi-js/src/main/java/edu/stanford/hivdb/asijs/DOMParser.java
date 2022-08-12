package edu.stanford.hivdb.asijs;

import elemental2.dom.Document;
import jsinterop.annotations.JsPackage;
import jsinterop.annotations.JsType;

@JsType(isNative = true, namespace = JsPackage.GLOBAL)
public class DOMParser {

    public native Document parseFromString(String string, String mimeType);

}
