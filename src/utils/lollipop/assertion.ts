import { LCUserInfo } from "../../generated/definitions/fn-lollipop/LCUserInfo";
import { SamlUserInfo } from "../../generated/definitions/fn-lollipop/SamlUserInfo";
import {
  AssertionType,
  AssertionTypeEnum
} from "../../generated/definitions/internal/AssertionType";

export const isAssertionSaml = (type: AssertionType) => (
  assertion: LCUserInfo
): assertion is SamlUserInfo =>
  type === AssertionTypeEnum.SAML && SamlUserInfo.is(assertion);
