package edu.stanford.hivdb.asijs;

import elemental2.dom.Node;
import elemental2.dom.XPathNSResolver;
import elemental2.dom.XPathResult;
import jsinterop.annotations.JsPackage;
import jsinterop.annotations.JsType;

@JsType(isNative = true, namespace = JsPackage.GLOBAL)
public class XPathEvaluator {
  public native XPathExpression createExpression(String expr, XPathNSResolver resolver);

  public native XPathExpression createExpression(String expr);

  public native XPathNSResolver createNSResolver(Node nodeResolver);

  public native XPathResult evaluate(
      String expr, Node contextNode, XPathNSResolver resolver, int type, Object result);

  public native XPathResult evaluate(
      String expr, Node contextNode, XPathNSResolver resolver, int type);

  public native XPathResult evaluate(String expr, Node contextNode, XPathNSResolver resolver);

  public native XPathResult evaluate(String expr, Node contextNode);
}

