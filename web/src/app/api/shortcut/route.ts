import { NextRequest, NextResponse } from "next/server";

function xe(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Generates an XML plist shortcut file.
 *
 * The shortcut asks for a number (amount) and text (reason), then GETs:
 *   /api/quick-add?token=TOKEN&amount=<Amount>&note=<Reason>
 *
 * Variable references in the URL use Shortcuts' WFTextTokenAttachmentParameterState
 * with character offsets. The object replacement char U+FFFC marks each slot.
 */
function buildPlist(token: string, serverUrl: string, kidName: string): string {
  // U+FFFC — Shortcuts uses this as a variable placeholder in token strings
  const PH = "\uFFFC";

  // Build URL string with placeholders at known positions
  // Format: <serverUrl>/api/quick-add?token=<token>&amount=PH&note=PH
  const prefix = `${serverUrl}/api/quick-add?token=${token}&amount=`;
  const middle = "&note=";
  const urlStr = prefix + PH + middle + PH;

  const amountOffset = prefix.length;            // offset of first PH
  const noteOffset   = prefix.length + 1 + middle.length; // offset of second PH

  const escapedUrl = xe(urlStr);
  const escapedKid = xe(kidName);

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>WFWorkflowActions</key>
	<array>
		<dict>
			<key>WFWorkflowActionIdentifier</key>
			<string>is.workflow.actions.ask</string>
			<key>WFWorkflowActionParameters</key>
			<dict>
				<key>WFAskActionDefaultAnswer</key>
				<string></string>
				<key>WFAskActionPrompt</key>
				<string>How many points for ${escapedKid}?</string>
				<key>WFInputType</key>
				<string>Number</string>
			</dict>
		</dict>
		<dict>
			<key>WFWorkflowActionIdentifier</key>
			<string>is.workflow.actions.setvariable</string>
			<key>WFWorkflowActionParameters</key>
			<dict>
				<key>WFVariableName</key>
				<string>Amount</string>
			</dict>
		</dict>
		<dict>
			<key>WFWorkflowActionIdentifier</key>
			<string>is.workflow.actions.ask</string>
			<key>WFWorkflowActionParameters</key>
			<dict>
				<key>WFAskActionDefaultAnswer</key>
				<string></string>
				<key>WFAskActionPrompt</key>
				<string>Reason?</string>
				<key>WFInputType</key>
				<string>Text</string>
			</dict>
		</dict>
		<dict>
			<key>WFWorkflowActionIdentifier</key>
			<string>is.workflow.actions.setvariable</string>
			<key>WFWorkflowActionParameters</key>
			<dict>
				<key>WFVariableName</key>
				<string>Reason</string>
			</dict>
		</dict>
		<dict>
			<key>WFWorkflowActionIdentifier</key>
			<string>is.workflow.actions.downloadurl</string>
			<key>WFWorkflowActionParameters</key>
			<dict>
				<key>WFHTTPMethod</key>
				<string>GET</string>
				<key>WFURL</key>
				<dict>
					<key>Value</key>
					<dict>
						<key>attachmentsByRange</key>
						<dict>
							<key>{${amountOffset}, 1}</key>
							<dict>
								<key>Type</key>
								<string>Variable</string>
								<key>VariableName</key>
								<string>Amount</string>
							</dict>
							<key>{${noteOffset}, 1}</key>
							<dict>
								<key>Type</key>
								<string>Variable</string>
								<key>VariableName</key>
								<string>Reason</string>
							</dict>
						</dict>
						<key>string</key>
						<string>${escapedUrl}</string>
					</dict>
					<key>WFSerializationType</key>
					<string>WFTextTokenAttachmentParameterState</string>
				</dict>
			</dict>
		</dict>
		<dict>
			<key>WFWorkflowActionIdentifier</key>
			<string>is.workflow.actions.showresult</string>
			<key>WFWorkflowActionParameters</key>
			<dict>
				<key>Text</key>
				<dict>
					<key>Value</key>
					<string>Points added for ${escapedKid}!</string>
					<key>WFSerializationType</key>
					<string>WFTextTokenString</string>
				</dict>
			</dict>
		</dict>
	</array>
	<key>WFWorkflowClientVersion</key>
	<string>2600.1</string>
	<key>WFWorkflowHasOutputFallback</key>
	<false/>
	<key>WFWorkflowHasShortcutInputVariables</key>
	<false/>
	<key>WFWorkflowIcon</key>
	<dict>
		<key>WFWorkflowIconGlyphNumber</key>
		<integer>59511</integer>
		<key>WFWorkflowIconStartColor</key>
		<integer>4282601983</integer>
	</dict>
	<key>WFWorkflowImportQuestions</key>
	<array/>
	<key>WFWorkflowInputContentItemClasses</key>
	<array/>
	<key>WFWorkflowMinimumClientVersion</key>
	<integer>900</integer>
	<key>WFWorkflowMinimumClientVersionString</key>
	<string>900</string>
	<key>WFWorkflowName</key>
	<string>Add ${escapedKid} Points</string>
	<key>WFWorkflowOutputContentItemClasses</key>
	<array/>
	<key>WFWorkflowTypes</key>
	<array/>
</dict>
</plist>`;
}

export async function GET(req: NextRequest) {
  const { searchParams, protocol, host } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) return new NextResponse("Missing token", { status: 400 });

  const kidName = process.env.NEXT_PUBLIC_KID_NAME ?? "Sam";
  const serverUrl = `${protocol}//${host}`;
  const plist = buildPlist(token, serverUrl, kidName);
  const filename = `Add-${kidName}-Points.shortcut`;

  return new NextResponse(plist, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
