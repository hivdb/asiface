package edu.stanford.hivdb.asijs;

import elemental2.dom.Node;
import elemental2.dom.XPathResult;
import jsinterop.annotations.JsPackage;
import jsinterop.annotations.JsType;

@JsType(isNative = true, namespace = JsPackage.GLOBAL)
public class XPathExpression {
  public native XPathResult evaluate(Node contextNode, int type, Object result);

  public native XPathResult evaluate(Node contextNode, int type);

  public native XPathResult evaluate(Node contextNode);
}
