from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate, Frame, Image, KeepTogether, NextPageTemplate, PageBreak,
    PageTemplate, Paragraph, Spacer, Table, TableStyle
)
from reportlab.platypus.tableofcontents import TableOfContents


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = Path(__file__).with_name("SignalOS_User_Manual.pdf")
LOGO = ROOT / "frontend" / "src" / "assets" / "signalos-logo.png"

PAGE_W, PAGE_H = A4
NAVY = colors.HexColor("#0F172A")
INK = colors.HexColor("#263244")
MUTED = colors.HexColor("#64748B")
LINE = colors.HexColor("#E2E8F0")
SOFT = colors.HexColor("#F8FAFC")
ORANGE = colors.HexColor("#F95738")
ORANGE_SOFT = colors.HexColor("#FFF0EC")
GREEN = colors.HexColor("#059669")
GREEN_SOFT = colors.HexColor("#ECFDF5")
BLUE = colors.HexColor("#3B82F6")
BLUE_SOFT = colors.HexColor("#EFF6FF")
AMBER = colors.HexColor("#B45309")
AMBER_SOFT = colors.HexColor("#FFFBEB")
RED = colors.HexColor("#B91C1C")
RED_SOFT = colors.HexColor("#FEF2F2")


class ManualDocTemplate(BaseDocTemplate):
    def __init__(self, filename, **kwargs):
        super().__init__(filename, **kwargs)
        frame = Frame(18 * mm, 18 * mm, PAGE_W - 36 * mm, PAGE_H - 34 * mm,
                      leftPadding=0, rightPadding=0, topPadding=10 * mm, bottomPadding=4 * mm)
        cover_frame = Frame(0, 0, PAGE_W, PAGE_H, leftPadding=0, rightPadding=0,
                            topPadding=0, bottomPadding=0)
        self.addPageTemplates([
            PageTemplate(id="cover", frames=[cover_frame], onPage=draw_cover_background),
            PageTemplate(id="body", frames=[frame], onPage=draw_body_chrome),
        ])

    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph):
            style = flowable.style.name
            if style in ("Chapter", "Section"):
                level = 0 if style == "Chapter" else 1
                text = flowable.getPlainText()
                key = f"heading-{self.seq.nextf('heading')}"
                self.canv.bookmarkPage(key)
                self.canv.addOutlineEntry(text, key, level=level, closed=False)
                self.notify("TOCEntry", (level, text, self.page, key))


def draw_cover_background(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    canvas.setFillColor(colors.HexColor("#17233A"))
    canvas.circle(PAGE_W + 15 * mm, PAGE_H - 20 * mm, 72 * mm, fill=1, stroke=0)
    canvas.setFillColor(ORANGE)
    canvas.circle(PAGE_W - 12 * mm, PAGE_H - 8 * mm, 31 * mm, fill=1, stroke=0)
    canvas.setStrokeColor(colors.Color(1, 1, 1, alpha=.08))
    canvas.setLineWidth(.6)
    for x in range(-20, 250, 16):
        canvas.line(x * mm, 0, (x - 65) * mm, PAGE_H)
    canvas.restoreState()


def draw_body_chrome(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(.6)
    canvas.line(18 * mm, PAGE_H - 12 * mm, PAGE_W - 18 * mm, PAGE_H - 12 * mm)
    canvas.setFont("Helvetica-Bold", 7)
    canvas.setFillColor(NAVY)
    canvas.drawString(18 * mm, PAGE_H - 9 * mm, "SignalOS")
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(MUTED)
    canvas.drawRightString(PAGE_W - 18 * mm, PAGE_H - 9 * mm, "USER MANUAL  |  VERSION 1.0")
    canvas.line(18 * mm, 12 * mm, PAGE_W - 18 * mm, 12 * mm)
    canvas.drawString(18 * mm, 7.5 * mm, "Autonomous Social Media Intelligence")
    canvas.drawRightString(PAGE_W - 18 * mm, 7.5 * mm, f"{doc.page}")
    canvas.restoreState()


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="CoverKicker", parent=styles["Normal"], fontName="Helvetica-Bold",
                          fontSize=9, leading=12, textColor=colors.HexColor("#FFB5A4"),
                          tracking=1.7, spaceAfter=8))
styles.add(ParagraphStyle(name="CoverTitle", parent=styles["Title"], fontName="Helvetica-Bold",
                          fontSize=34, leading=37, textColor=colors.white, spaceAfter=14))
styles.add(ParagraphStyle(name="CoverSubtitle", parent=styles["Normal"], fontName="Helvetica",
                          fontSize=13, leading=19, textColor=colors.HexColor("#CBD5E1"), spaceAfter=26))
styles.add(ParagraphStyle(name="CoverMeta", parent=styles["Normal"], fontName="Helvetica",
                          fontSize=9, leading=14, textColor=colors.HexColor("#94A3B8")))
styles.add(ParagraphStyle(name="Chapter", parent=styles["Heading1"], fontName="Helvetica-Bold",
                          fontSize=22, leading=27, textColor=NAVY, spaceBefore=2, spaceAfter=12,
                          keepWithNext=True))
styles.add(ParagraphStyle(name="Section", parent=styles["Heading2"], fontName="Helvetica-Bold",
                          fontSize=14, leading=18, textColor=NAVY, spaceBefore=14, spaceAfter=7,
                          keepWithNext=True))
styles.add(ParagraphStyle(name="Subsection", parent=styles["Heading3"], fontName="Helvetica-Bold",
                          fontSize=10.5, leading=14, textColor=INK, spaceBefore=9, spaceAfter=4,
                          keepWithNext=True))
styles.add(ParagraphStyle(name="BodyManual", parent=styles["BodyText"], fontName="Helvetica",
                          fontSize=9.2, leading=14, textColor=INK, spaceAfter=7))
styles.add(ParagraphStyle(name="Small", parent=styles["BodyText"], fontName="Helvetica",
                          fontSize=7.5, leading=11, textColor=MUTED))
styles.add(ParagraphStyle(name="BulletManual", parent=styles["BodyText"], fontName="Helvetica",
                          fontSize=9, leading=13.5, leftIndent=12, firstLineIndent=-7,
                          bulletIndent=0, textColor=INK, spaceAfter=4))
styles.add(ParagraphStyle(name="StepNumber", parent=styles["Normal"], fontName="Helvetica-Bold",
                          fontSize=12, textColor=colors.white, alignment=TA_CENTER, leading=18))
styles.add(ParagraphStyle(name="StepText", parent=styles["BodyText"], fontName="Helvetica",
                          fontSize=9, leading=13.5, textColor=INK))
styles.add(ParagraphStyle(name="CalloutTitle", parent=styles["Normal"], fontName="Helvetica-Bold",
                          fontSize=8, leading=11, textColor=NAVY, spaceAfter=3))
styles.add(ParagraphStyle(name="CalloutBody", parent=styles["Normal"], fontName="Helvetica",
                          fontSize=8.2, leading=12, textColor=INK))
styles.add(ParagraphStyle(name="TableHead", parent=styles["Normal"], fontName="Helvetica-Bold",
                          fontSize=7.7, leading=10, textColor=colors.white))
styles.add(ParagraphStyle(name="TableCell", parent=styles["Normal"], fontName="Helvetica",
                          fontSize=7.6, leading=10.5, textColor=INK))
styles.add(ParagraphStyle(name="TOCHeading", parent=styles["Heading1"], fontName="Helvetica-Bold",
                          fontSize=24, textColor=NAVY, spaceAfter=16))


def P(text, style="BodyManual"):
    return Paragraph(text, styles[style])


def chapter(number, title, intro=None):
    items = [P(f"{number}. {title}", "Chapter")]
    if intro:
        items.append(P(intro))
    return items


def section(title, intro=None):
    items = [P(title, "Section")]
    if intro:
        items.append(P(intro))
    return items


def bullets(items):
    return [P(f"- {item}", "BulletManual") for item in items]


def steps(items):
    rows = []
    for i, item in enumerate(items, 1):
        bubble = Table([[P(str(i), "StepNumber")]], colWidths=[8 * mm], rowHeights=[8 * mm])
        bubble.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), ORANGE),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("BOX", (0, 0), (-1, -1), 0, ORANGE),
        ]))
        rows.append([bubble, P(item, "StepText")])
    table = Table(rows, colWidths=[11 * mm, 156 * mm], hAlign="LEFT")
    table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (0, -1), 3 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 2.2 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.2 * mm),
    ]))
    return table


def callout(title, body, tone="blue"):
    tones = {
        "blue": (BLUE_SOFT, BLUE), "green": (GREEN_SOFT, GREEN),
        "amber": (AMBER_SOFT, AMBER), "red": (RED_SOFT, RED),
        "orange": (ORANGE_SOFT, ORANGE),
    }
    bg, accent = tones[tone]
    table = Table([[P(title.upper(), "CalloutTitle")], [P(body, "CalloutBody")]], colWidths=[167 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LINEBEFORE", (0, 0), (0, -1), 3, accent),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (0, 0), 8),
        ("BOTTOMPADDING", (0, 1), (0, 1), 9),
    ]))
    return KeepTogether([Spacer(1, 3), table, Spacer(1, 7)])


def data_table(headers, rows, widths=None):
    data = [[P(h, "TableHead") for h in headers]]
    data += [[P(str(cell), "TableCell") for cell in row] for row in rows]
    table = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, SOFT]),
        ("GRID", (0, 0), (-1, -1), .45, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return table


def pipeline_diagram():
    cells = []
    agents = [
        ("01", "COLLECTION", "Clean and normalize"),
        ("02", "NLP", "Sentiment and intent"),
        ("03", "VECTOR RAG", "Retrieve evidence"),
        ("04", "GENERATION", "Draft and summarize"),
    ]
    for number, name, detail in agents:
        cells.append(P(f"<b><font color='#F95738'>{number}</font>  {name}</b><br/><font size='7' color='#64748B'>{detail}</font>", "TableCell"))
    table = Table([cells], colWidths=[41.75 * mm] * 4, rowHeights=[25 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), SOFT),
        ("BOX", (0, 0), (-1, -1), .7, LINE),
        ("INNERGRID", (0, 0), (-1, -1), .7, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    return table


story = []

# Cover
story += [Spacer(1, 34 * mm)]
if LOGO.exists():
    logo = Image(str(LOGO), width=21 * mm, height=21 * mm)
    story += [logo, Spacer(1, 8 * mm)]
story += [
    P("SIGNALOS  /  PRODUCT DOCUMENTATION", "CoverKicker"),
    P("User Manual", "CoverTitle"),
    P("The complete guide to autonomous social-media intelligence, evidence-grounded insights, and human-governed response workflows.", "CoverSubtitle"),
    Table([[P("VERSION", "CoverMeta"), P("1.0", "CoverMeta")],
           [P("RELEASE", "CoverMeta"), P("October 2026", "CoverMeta")],
           [P("AUDIENCE", "CoverMeta"), P("Members, reviewers, and administrators", "CoverMeta")]],
          colWidths=[30 * mm, 88 * mm], style=TableStyle([
              ("LINEABOVE", (0, 0), (-1, 0), .5, colors.Color(1, 1, 1, alpha=.25)),
              ("LINEBELOW", (0, -1), (-1, -1), .5, colors.Color(1, 1, 1, alpha=.25)),
              ("TEXTCOLOR", (0, 0), (-1, -1), colors.white),
              ("TOPPADDING", (0, 0), (-1, -1), 7),
              ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
              ("LEFTPADDING", (0, 0), (-1, -1), 0),
          ])),
    Spacer(1, 34 * mm),
    P("SignalOS  |  Brand Intelligence", "CoverMeta"),
    NextPageTemplate("body"), PageBreak(),
]

# Front matter
story += [P("Document information", "Chapter")]
story.append(data_table(["Field", "Details"], [
    ("Purpose", "Help end users operate SignalOS safely and confidently from registration through report approval."),
    ("Scope", "Public experience, member workspace, reviewer workflow, administrator tools, billing, troubleshooting, and responsible AI guidance."),
    ("Application", "SignalOS autonomous social-media intelligence platform."),
    ("Convention", "UI labels are shown in bold. Examples are illustrative; your organization, plan, and data may differ."),
], [34 * mm, 133 * mm]))
story += [Spacer(1, 8), callout("Human approval is mandatory", "SignalOS creates analysis and response drafts. It does not publish content automatically. A qualified person must verify evidence, edit as needed, and approve or reject every draft.", "orange")]
story += section("How to use this manual")
story += bullets([
    "New users should read Chapters 1-5 in sequence, then use the task chapters as needed.",
    "Reviewers should focus on Chapters 8, 9, and 13.",
    "Administrators should also read Chapters 14-17.",
    "Use the PDF bookmarks or table of contents to jump directly to a topic.",
])
story += [PageBreak(), P("Contents", "TOCHeading")]
toc = TableOfContents()
toc.levelStyles = [
    ParagraphStyle(name="TOC0", fontName="Helvetica-Bold", fontSize=9.5, leading=16,
                   leftIndent=0, firstLineIndent=0, textColor=NAVY, spaceBefore=3),
    ParagraphStyle(name="TOC1", fontName="Helvetica", fontSize=8.5, leading=13,
                   leftIndent=12, firstLineIndent=0, textColor=MUTED),
]
story += [toc, PageBreak()]

# 1
story += chapter(1, "Welcome to SignalOS", "SignalOS helps teams turn permitted or public social mentions into structured intelligence, evidence-grounded reports, and review-ready response drafts.")
story += section("What the platform does")
story += bullets([
    "Collects and normalizes social posts and comments from approved sources.",
    "Detects sentiment, confidence, emotion, intent, priority, entities, and topics.",
    "Searches similar mentions and authoritative knowledge using semantic retrieval.",
    "Creates executive summaries and response drafts grounded in retrieved evidence.",
    "Keeps generated content behind a visible human approval workflow.",
    "Maintains alerts, pipeline traces, evaluation metrics, usage limits, and audit-ready records.",
])
story += section("The four-agent model")
story += [pipeline_diagram(), Spacer(1, 8)]
story.append(callout("Interpretation", "Agent outputs are decision-support signals, not objective facts. Confidence, source quality, language, sarcasm, and context can affect results.", "amber"))
story += section("Supported operating model")
story.append(data_table(["Role", "Primary responsibilities", "Additional access"], [
    ("Member", "Create monitoring profiles, ingest mentions, run pipelines, search, and view reports.", "Own workspace records and subscription usage."),
    ("Reviewer", "Inspect evidence, edit response drafts, and approve or reject them.", "Shared review workflow, subject to organization policy."),
    ("Administrator", "Oversee system operation and shared grounding content.", "Knowledge Base, Agent Logs, Admin Console, and cross-system diagnostics."),
], [27 * mm, 87 * mm, 53 * mm]))

# 2
story += [PageBreak()] + chapter(2, "Public website and live preview", "The public experience is available without signing in and explains the platform before account creation.")
story += section("Homepage")
story += bullets([
    "Review the platform overview, four-agent pipeline demonstration, pricing, and frequently asked questions.",
    "Use the interactive simulator to enter a brand or keyword and preview a representative pipeline result.",
    "Select <b>Start Monitoring Free</b> to create an account or <b>Sign In</b> if you already have one.",
])
story += section("Live Preview")
story += bullets([
    "Explore representative dashboard cards, sentiment distribution, mention activity, and agent outputs.",
    "Test the sample vector-search experience to understand similarity-based retrieval.",
    "Preview data is demonstrative and is not a substitute for running your own workspace pipeline.",
])
story += section("Use Cases and Capabilities")
story += bullets([
    "Use Cases describes workflows for brands, creators, PR teams, agencies, and reputation management.",
    "Capabilities explains NLP, retrieval, grounding, response generation, and human governance.",
])

# 3
story += [PageBreak()] + chapter(3, "Create and access your account")
story += section("Register a workspace")
story.append(steps([
    "Open <b>Register Free</b> from the public navigation.",
    "Enter your name, business email, company or workspace name, and country when requested.",
    "Create and confirm a strong password. Use a unique password that is not shared with another service.",
    "Submit the form, review any validation messages, and continue into onboarding.",
]))
story.append(callout("Free allowance", "A new Free account receives 20 pipeline runs. The current remaining allowance appears in the workspace sidebar and subscription area.", "green"))
story += section("Sign in and sign out")
story.append(steps([
    "Select <b>Sign In</b>, enter the registered email and password, then submit.",
    "After authentication, SignalOS opens the protected workspace.",
    "To end the session, select the sign-out icon in the account card at the bottom of the sidebar.",
]))
story += section("Session security")
story += bullets([
    "Do not share credentials or authentication tokens.",
    "Sign out on shared devices and close the browser when finished.",
    "If access appears incorrect, stop using the account and contact an administrator.",
])

# 4
story += [PageBreak()] + chapter(4, "Onboarding and workspace navigation")
story += section("First-time onboarding")
story += bullets([
    "The welcome experience introduces the workspace and can launch a guided product tour.",
    "The setup wizard asks for a profile type, monitored subject, and preferred platforms.",
    "Review the setup summary before finishing. You can maintain monitoring profiles later under <b>My Brands</b>.",
    "Use <b>How It Works</b> in the top bar to restart the tour at any time.",
])
story += section("Workspace map")
story.append(data_table(["Navigation item", "Use it for"], [
    ("Overview", "KPIs, usage, recent signals, pipeline launcher, and live agent trace."),
    ("My Brands", "Monitoring profiles, keywords, platforms, status, and brand-level runs."),
    ("Mentions Stream", "Manual or connected-source ingestion and the mention ledger."),
    ("Analytics", "NLP sentiment, emotion, intent, entities, topics, and priority."),
    ("Vector RAG", "Semantic searches and ranked related content."),
    ("AI Insights & Reports", "Generate, inspect, export, and review intelligence reports."),
    ("Pipeline History", "Search and inspect previous four-agent runs."),
    ("Alerts", "Negative-sentiment signals requiring attention."),
    ("Subscription & Billing", "Plan, allowance, upgrades, and payment history."),
    ("Connections", "Configure permitted platform data sources."),
    ("System Evaluation", "Agent performance and quality-evaluation results."),
    ("Settings", "Runtime service health and configuration status."),
], [47 * mm, 120 * mm]))
story.append(callout("Role-aware navigation", "Knowledge Base, Agent Logs, and Admin Console appear only for administrators. Subscription controls may be hidden for administrative accounts.", "blue"))

# 5
story += [PageBreak()] + chapter(5, "Overview dashboard", "The Overview page is the operational starting point for daily monitoring.")
story += section("Read the dashboard")
story += bullets([
    "Summary cards show current monitoring and intelligence activity.",
    "Sentiment and trend panels help identify changes that may need investigation.",
    "The usage indicator shows used, remaining, and total pipeline runs for the active plan.",
    "Recent mentions, alerts, and reports provide direct paths into detailed records.",
])
story += section("Run an autonomous brand-intelligence query")
story.append(steps([
    "Locate <b>Run Autonomous Brand Intelligence Pipeline</b>.",
    "Enter a focused brand name, keyword, or question. Include the topic and decision context when possible.",
    "Start the pipeline. Keep the page open while the live trace advances through the four agents.",
    "Inspect the completed result, supporting evidence, warnings, and generated report links.",
]))
story.append(callout("Better queries", "Prefer a specific question such as 'Acme mobile-app pricing complaints this week' over a broad word such as 'Acme'. Specific queries improve retrieval relevance and report usefulness.", "green"))

# 6
story += [PageBreak()] + chapter(6, "Monitoring profiles: My Brands")
story += section("Create a profile")
story.append(steps([
    "Open <b>My Brands</b> and choose <b>Add Brand Profile</b>.",
    "Select the profile type, such as brand, creator, product, or keyword.",
    "Enter the display name and primary keyword used for collection and analysis.",
    "Add alternative keywords, hashtags, handles, or product names to improve coverage.",
    "Choose approved platforms, add a short context description, and save.",
]))
story += section("Manage profiles")
story += bullets([
    "Use search to find a profile by name or keyword.",
    "Open a profile to view its mentions, statistics, sentiment, platforms, and last run.",
    "Use <b>Edit</b> to maintain keywords or scope.",
    "Use <b>Pause</b> when monitoring should temporarily stop; resume when collection is authorized again.",
    "Use <b>Run Pipeline</b> to execute brand-level intelligence, subject to available quota.",
    "Delete only when the profile and its operational context are no longer required. Confirm organizational retention requirements first.",
])

# 7
story += [PageBreak()] + chapter(7, "Collect and manage mentions")
story += section("Add a mention manually")
story.append(steps([
    "Open <b>Mentions Stream</b> and select the manual-ingestion option.",
    "Choose the source platform and enter the author or brand handle.",
    "Provide a source identifier when available, then paste the full mention text.",
    "Add timestamp, engagement, and comment details when known, then save.",
]))
story += section("Import from approved sources")
story += bullets([
    "Use the source URL or configured connection controls only for content your organization is permitted to process.",
    "For supported connection workflows, select a platform and provide the requested query, channel, or subreddit.",
    "Verify imported text and metadata before using it for a high-impact decision.",
])
story += section("Work with the stream")
story += bullets([
    "Search by author, content, or channel; use available filters to narrow the list.",
    "Open a mention to inspect metadata, engagement, NLP results, and pipeline history.",
    "Edit incorrect source data before analysis when permitted.",
    "Delete only records that are erroneous or legitimately outside retention scope.",
])
story.append(callout("Data responsibility", "Do not ingest private, restricted, unlawfully obtained, or unnecessary personal information. Follow platform terms, consent requirements, and your organization's retention policy.", "red"))

# 8
story += [PageBreak()] + chapter(8, "Run the four-agent pipeline")
story += section("Run from a mention")
story.append(steps([
    "Open a mention from <b>Mentions Stream</b>.",
    "Review the original content and metadata for accuracy.",
    "Choose <b>Run Full Pipeline</b>. One quota unit may be consumed when the run starts successfully.",
    "Watch Collection, NLP, Retrieval, and Generation progress. Do not resubmit repeatedly while a run is active.",
    "When complete, inspect the stage results, generated insight, and draft response.",
]))
story += section("Understand run states")
story.append(data_table(["State", "Meaning", "What to do"], [
    ("Queued", "Accepted and waiting for processing.", "Wait; refresh only if the status remains unchanged for an unusual period."),
    ("Running", "One or more agents are processing the item.", "Use the live trace to identify the active stage."),
    ("Completed", "All required stages returned a result.", "Review evidence, warnings, and the generated draft."),
    ("Failed", "A stage or supporting service could not complete.", "Read the error, check Settings, and retry only after correcting the cause."),
], [24 * mm, 61 * mm, 82 * mm]))
story += section("Pipeline History")
story += bullets([
    "Search by run ID, brand, or query.",
    "Filter by status and date when available.",
    "Open a run to review input, timestamps, per-agent status, outputs, and associated report.",
])

# 9
story += [PageBreak()] + chapter(9, "NLP analytics and interpretation")
story += section("Signals available")
story.append(data_table(["Signal", "Interpretation"], [
    ("Sentiment", "Estimated positive, neutral, or negative polarity, often accompanied by score and confidence."),
    ("Emotion", "Fine-grained emotional signal such as joy, anger, surprise, fear, sadness, or trust."),
    ("Intent", "Likely purpose, such as praise, inquiry, complaint, purchase interest, or support request."),
    ("Priority", "Operational urgency: low, medium, high, or urgent."),
    ("Entities", "Recognized people, organizations, products, places, or other named subjects."),
    ("Topics", "Themes, keywords, and hashtags extracted from the text."),
], [35 * mm, 132 * mm]))
story += section("Analyze and investigate")
story += bullets([
    "Use Analytics to search posts, handles, topics, or entities and compare signals across records.",
    "Open a record before acting on a high-priority or negative result.",
    "Use the Vector Knowledge Base action to investigate a topic in related mentions and grounding content.",
    "Treat low-confidence classifications, sarcasm, mixed sentiment, code-switching, and short texts cautiously.",
])
story.append(callout("Do not automate punitive decisions", "Never use sentiment or emotion labels alone for employment, access, eligibility, enforcement, or other consequential decisions. Require contextual human review.", "red"))

# 10
story += [PageBreak()] + chapter(10, "Vector RAG and semantic search")
story += section("Search your collection")
story.append(steps([
    "Open <b>Vector RAG</b>.",
    "Enter a natural-language query that describes the meaning you want to find.",
    "Choose the result count when available and run the search.",
    "Review ranked results, similarity or relevance, source metadata, and the original text.",
    "Open the saved search from Search History when you need to revisit the result set.",
]))
story += section("How to judge evidence")
story += bullets([
    "Relevance means semantically related; it does not prove truth or authority.",
    "Prefer current, authoritative, directly applicable sources over a high score alone.",
    "Check whether evidence actually supports the generated claim.",
    "If the interface reports insufficient evidence, do not approve unsupported factual statements.",
])

# 11
story += [PageBreak()] + chapter(11, "AI insights, reports, and exports")
story += section("Generate a report")
story.append(steps([
    "Open <b>AI Insights & Reports</b>.",
    "Select the source retrieval or relevant analysis context when requested.",
    "Start synthesis and wait for the report to appear in the reports ledger.",
    "Open the report and verify summary, sentiment dynamics, topics, evidence, recommendations, and draft response.",
]))
story += section("Read warnings and provenance")
story += bullets([
    "Knowledge sources identify grounding material used for the report.",
    "An insufficient-evidence warning means the retrieved context may not support a reliable answer.",
    "A local-fallback label means the configured external language model was unavailable or not used; review the result with extra care.",
])
story += section("Export")
story += bullets([
    "Use Markdown for an editable, human-readable report.",
    "Use JSON when another authorized system needs structured data.",
    "Use PDF where available for controlled distribution and presentation.",
    "Exported data remains subject to the same confidentiality, retention, and access rules as the workspace record.",
])

# 12
story += [PageBreak()] + chapter(12, "Review and authorize a response draft")
story += section("Review checklist")
story += bullets([
    "Confirm the original mention and author context.",
    "Verify every factual claim against cited evidence or an authoritative internal source.",
    "Check tone, empathy, policy alignment, privacy, legal risk, and brand voice.",
    "Remove unnecessary personal information and unsupported promises.",
    "Ensure the response is appropriate for the intended platform and audience.",
])
story += section("Approve, edit, or reject")
story.append(steps([
    "Open the Executive Intelligence Report and locate <b>Response Authorization & Compliance Sign-off</b>.",
    "Edit the draft statement directly if changes are required.",
    "Add a review note describing verification performed, changes made, or the reason for rejection.",
    "Choose <b>Approve</b> only when the final text is ready for a separate publishing process; otherwise choose <b>Reject</b>.",
]))
story.append(callout("Approval does not publish", "An approved response remains a governed artifact in SignalOS. Publishing must occur through your organization's authorized channel and process.", "orange"))

# 13
story += [PageBreak()] + chapter(13, "Alerts and incident response")
story += section("Work an alert")
story.append(steps([
    "Open <b>Alerts</b> and prioritize unread, high-severity, or urgent items.",
    "Open the associated mention and validate the source, context, and NLP confidence.",
    "Review related mentions, brand history, retrieved evidence, and any existing response guidance.",
    "Escalate through your organization's incident path when legal, safety, security, or crisis thresholds are met.",
    "Update or acknowledge the alert only after recording the action taken.",
]))
story += section("Suggested severity handling")
story.append(data_table(["Priority", "Typical action"], [
    ("Low", "Monitor or include in routine reporting."),
    ("Medium", "Review during the current operating cycle and look for repetition."),
    ("High", "Prompt human investigation and coordinated response planning."),
    ("Urgent", "Immediate escalation under the approved crisis or safety procedure."),
], [32 * mm, 135 * mm]))

# 14
story += [PageBreak()] + chapter(14, "Connections and data sources")
story += section("Configure a connection")
story.append(steps([
    "Open <b>Connections</b> and select a platform.",
    "Review the platform-specific connection wizard and authorization scope.",
    "Provide the requested query, subreddit, channel, or other approved source details.",
    "Complete authorization, then verify that the connection is shown as configured.",
]))
story += section("Connection governance")
story += bullets([
    "Use least-privilege credentials and organization-owned service accounts where possible.",
    "Do not paste access tokens into ordinary text fields or reports.",
    "Disconnect sources that are no longer approved or required.",
    "A configured connection does not remove the need to comply with platform terms and applicable law.",
])
story.append(callout("Current deployment limitations", "Available sources depend on the deployed configuration. Where a direct provider integration is not enabled, use only approved manual or dataset-based ingestion.", "amber"))

# 15
story += [PageBreak()] + chapter(15, "Subscription, usage, and billing")
story += section("Understand usage")
story += bullets([
    "The sidebar quota card shows the active plan and remaining pipeline runs.",
    "Free accounts begin with 20 runs. Paid-plan limits and features appear in Subscription & Billing.",
    "A complete or accepted pipeline operation may consume allowance. Avoid duplicate submissions.",
])
story += section("Change a plan")
story.append(steps([
    "Open <b>Subscription & Billing</b> and compare the available intelligence plans.",
    "Select the plan and billing cycle appropriate for your organization.",
    "Review price, run allowance, tracked-profile limit, and included features before checkout.",
    "Complete the payment form through the configured billing experience and confirm activation.",
    "Review Payment & Invoice History after purchase.",
]))
story.append(callout("Payment data", "Only enter payment information into the authorized checkout interface. Never place card data in mentions, reports, review notes, support messages, or screenshots.", "red"))

# 16
story += [PageBreak()] + chapter(16, "Administrator guide")
story += section("Knowledge Base")
story.append(steps([
    "Open <b>Knowledge Base</b> and inspect current index statistics and documents.",
    "Add an authoritative title, source URL where applicable, tags, and the full approved text; or upload a supported .txt, .md, or .json file.",
    "Confirm the document appears in Indexed Documents and that indexing succeeds.",
    "Use reindex after material index changes or recovery, not as a routine response to unrelated errors.",
    "Delete obsolete documents only after confirming replacement and retention requirements.",
]))
story += bullets([
    "Prefer policy owners, official documentation, approved FAQs, and current product information.",
    "Remove secrets, credentials, unnecessary personal data, and unapproved copyrighted material.",
    "Use clear version and effective-date information in the content.",
])
story += section("Agent Logs")
story += bullets([
    "Filter execution traces by agent and status.",
    "Expand a pipeline run to follow all four agent events and timestamps.",
    "Use logs for diagnosis and audit support; do not expose sensitive log details to unauthorized users.",
])
story += section("Admin Console")
story += bullets([
    "Review system intelligence and workspace oversight metrics.",
    "Search users by name, email, or company and apply only authorized account actions.",
    "Maintain subscription-plan settings carefully; changes can affect entitlements and quotas.",
    "Record justification for material access, plan, or administrative changes according to policy.",
])

# 17
story += [PageBreak()] + chapter(17, "System evaluation and settings")
story += section("System Evaluation")
story += bullets([
    "Use evaluation results to inspect collection, NLP, retrieval, and generation quality.",
    "Only treat precision, recall, F1, confusion matrices, retrieval metrics, or grounded-generation scores as valid when computed from an approved labelled dataset.",
    "Compare results across the same dataset version and configuration; do not compare incompatible runs.",
])
story += section("Settings and runtime health")
story.append(data_table(["Group", "What it indicates"], [
    ("Application", "Backend runtime and environment summary."),
    ("MongoDB", "Persistence connection status."),
    ("Vector store", "Knowledge index mode, document availability, and retrieval readiness."),
    ("Python agent service", "Availability of the authoritative compute pipeline."),
    ("Language model", "Configured generation provider or fallback state."),
    ("Agents", "Readiness of collection, analysis, retrieval, and generation components."),
], [40 * mm, 127 * mm]))
story.append(callout("Fallback behavior", "If the external model is unavailable, SignalOS may create a labelled local-fallback result. The label is not an error by itself, but the output still requires evidence review.", "blue"))

# 18
story += [PageBreak()] + chapter(18, "Troubleshooting")
story.append(data_table(["Issue", "Likely cause", "Recommended action"], [
    ("Cannot sign in", "Incorrect credentials, expired session, or account issue.", "Re-enter credentials, confirm email, then contact an administrator if the problem persists."),
    ("Pipeline will not start", "No quota, invalid input, active duplicate run, or service problem.", "Check usage, shorten/clarify input, wait for active work, and review Settings."),
    ("Run remains queued", "Worker or Python service is unavailable or busy.", "Check Settings; administrator should inspect Agent Logs and backend health."),
    ("No retrieval results", "Query is too narrow or index lacks relevant content.", "Broaden the query, verify source data, and ask an administrator to inspect knowledge indexing."),
    ("Insufficient evidence", "Retrieved sources do not support the requested claims.", "Add or correct authoritative knowledge, rerun retrieval, or omit unsupported claims."),
    ("Local fallback shown", "External generation provider is not configured, timed out, or failed.", "Review the output manually; administrator should check Language model status."),
    ("No alerts", "No qualifying negative analyses exist or data has not been analyzed.", "Analyze relevant mentions and confirm alert thresholds/configuration."),
    ("Navigation item missing", "The current role does not have access.", "Confirm the intended role with an administrator; do not attempt to bypass access controls."),
    ("Import fails", "Invalid URL/query, unsupported source, or provider authorization issue.", "Verify source details, connection state, and permitted integration support."),
], [35 * mm, 58 * mm, 74 * mm]))
story += section("Information to capture for support")
story += bullets([
    "Time of the issue and user role (do not include passwords or tokens).",
    "Page name, run ID, report ID, or mention ID.",
    "Exact visible error message and the action immediately before it.",
    "Relevant service status from Settings and whether retrying produced the same result.",
])

# 19
story += [PageBreak()] + chapter(19, "Security, privacy, and responsible AI")
story += section("Required practices")
story += bullets([
    "Process only authorized data and minimize personal information.",
    "Apply least privilege: members, reviewers, and administrators should have only the access needed for their work.",
    "Treat social content and retrieved text as untrusted. Do not follow instructions embedded in source content.",
    "Verify source provenance and factual claims before approving generated material.",
    "Never store credentials, API keys, card data, or private access tokens in content fields.",
    "Follow organizational retention, deletion, incident, and legal-review policies.",
])
story += section("Responsible interpretation")
story += bullets([
    "NLP is English-oriented and can perform poorly on slang, sarcasm, short messages, mixed languages, or missing context.",
    "Similarity scores indicate related meaning, not truth, causation, endorsement, or legal authority.",
    "Generated drafts can be incomplete or incorrect even when fluent.",
    "High-impact or crisis communication requires qualified human judgment and escalation.",
])
story.append(callout("Golden rule", "No draft should be approved because it sounds confident. Approve only after its claims, evidence, tone, audience, and policy alignment have been checked.", "orange"))

# 20
story += [PageBreak()] + chapter(20, "Quick-reference workflows")
story += section("Daily monitoring")
story.append(steps([
    "Review Overview metrics, remaining quota, and recent alerts.",
    "Inspect new mentions and validate their source data.",
    "Analyze or run the full pipeline on relevant items.",
    "Investigate negative, high-priority, or unusual signals using semantic search.",
    "Review generated reports and route drafts to an authorized reviewer.",
]))
story += section("Respond to a reputational issue")
story.append(steps([
    "Validate the triggering mention and identify related conversations.",
    "Check sentiment confidence, intent, priority, and source credibility.",
    "Retrieve current authoritative policy or product evidence.",
    "Generate a report, edit the response draft, and obtain human sign-off.",
    "Publish only through an approved external process and record the outcome.",
]))
story += section("Prepare a weekly intelligence review")
story.append(steps([
    "Confirm monitoring profiles and source coverage.",
    "Review sentiment shifts, recurring topics, priorities, and alert outcomes.",
    "Open representative mentions and compare them with semantic-search results.",
    "Generate or select executive reports and verify citations.",
    "Export approved material and distribute it under the correct access classification.",
]))

# Glossary
story += [PageBreak()] + chapter("A", "Glossary")
story.append(data_table(["Term", "Definition"], [
    ("Agent", "A specialized processing component responsible for one stage of the intelligence workflow."),
    ("Analysis", "Structured NLP interpretation of a mention, including sentiment, intent, emotion, entities, and priority."),
    ("Confidence", "The model's estimate of certainty; it is not a guarantee of correctness."),
    ("Entity", "A recognized named subject such as a person, organization, location, or product."),
    ("Grounding", "Using retrieved evidence to constrain and support generated content."),
    ("Human in the loop", "A workflow requiring a person to inspect and authorize an AI-produced result."),
    ("Knowledge Base", "Administrator-managed authoritative documents available to retrieval and generation."),
    ("Mention", "A collected social post, comment, review, or other approved source record."),
    ("Pipeline run", "One execution of Collection, NLP, Retrieval, and Generation for a subject or mention."),
    ("RAG", "Retrieval-Augmented Generation: retrieving relevant evidence before generating a response."),
    ("Semantic search", "Search based on meaning rather than exact keyword matching alone."),
    ("Vector store", "An index of numerical text representations used for similarity retrieval."),
], [38 * mm, 129 * mm]))

story += [PageBreak(), Spacer(1, 45 * mm), P("SignalOS", "CoverTitle"),
          P("Know what people are saying. Understand why it matters. Respond with evidence and human judgment.", "CoverSubtitle"),
          callout("End of manual", "For deployment-specific URLs, policies, support contacts, and service-level commitments, consult your organization's SignalOS administrator.", "orange")]


doc = ManualDocTemplate(
    str(OUTPUT), pagesize=A4, rightMargin=18 * mm, leftMargin=18 * mm,
    topMargin=18 * mm, bottomMargin=16 * mm,
    title="SignalOS User Manual", author="SignalOS",
    subject="Professional end-user manual for the SignalOS platform",
)
doc.multiBuild(story)
print(OUTPUT)
