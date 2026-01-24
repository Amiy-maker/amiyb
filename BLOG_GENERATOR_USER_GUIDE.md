# Blog Generator - User Guide

## Overview

The **Blog Generator** is a powerful web application designed to help you create SEO-optimized blog posts with minimal effort. It allows you to write content using simple section markers, which are then automatically converted into professional HTML format ready for publication.

### Key Features:
- **Smart Section System**: 12 predefined section types with automatic HTML formatting
- **Multiple Input Options**: Upload documents (.txt, .md, .docx) or write directly in the editor
- **Image Management**: Upload images directly to Shopify integration
- **One-Click Publishing**: Publish directly to your Shopify store
- **SEO Optimization**: Automatic HTML structure optimized for search engines
- **Preview & Export**: View results and download as HTML files

---

## Getting Started

### Step 1: Access the Application

Navigate to the Blog Generator at: `/blog/generator`

You will see the main interface with three key sections:

**Left Sidebar:**
- Upload Document card
- Quick Insert buttons for section markers
- Information panel

**Main Content Area:**
- Editor tab for writing content
- Preview tab for viewing generated HTML
- Generate button to create HTML

![Blog Generator Main Interface](./app-screenshots/step-1-main-interface.png)

---

## How to Use: Step-by-Step Guide

### Option A: Upload an Existing Document

#### Step 1: Click "Choose File" Button

In the left sidebar, locate the **"Upload Document"** card and click the **"Choose File"** button.

![Upload Document Card](./app-screenshots/step-2-upload-document.png)

**Supported file formats:**
- `.txt` - Plain text files
- `.md` - Markdown files  
- `.docx` - Microsoft Word documents

#### Step 2: Select Your File

A file browser will open. Navigate to and select your document file.

#### Step 3: Confirm Upload

Once selected, the document content will automatically load into the editor. You'll see a success notification: "Document '[filename]' loaded successfully"

---

### Option B: Write Content Directly

#### Step 1: Use the Editor Tab

Click on the **"Editor"** tab (it should be active by default) to see the text editor.

![Editor Tab](./app-screenshots/step-3-editor-tab.png)

#### Step 2: Start Writing

Click in the text area and begin typing your blog content.

**Key Points:**
- Write your content naturally, as you would in any word processor
- Use section markers to organize your content into structured sections
- Section markers tell the system how to format different parts of your blog

---

## Using Section Markers

### Understanding Section Markers

Section markers are special tags that divide your content into meaningful sections. Each section type has specific HTML formatting rules optimized for SEO.

The format is: `{sectionX}` where X is the section number (1-12)

### The 12 Section Types

The application provides 12 predefined section types, each serving a specific purpose:

| Section | Name | Purpose |
|---------|------|---------|
| `{section1}` | **Hero/Title** | Main headline and introduction of your blog post |
| `{section2}` | **Intro Paragraph** | Opening paragraph that sets context |
| `{section3}` | **Table of Contents** | Overview of what readers will learn |
| `{section4}` | **Key Benefits/Overview** | Main benefits or overview of the topic |
| `{section5}` | **Section Body** | Main content sections |
| `{section6}` | **Statistics/Facts** | Data, statistics, and factual information |
| `{section7}` | **Comparison** | Comparisons between options or concepts |
| `{section8}` | **Expert Quote** | Quotes from experts or authorities |
| `{section9}` | **How-To Steps** | Step-by-step instructions or processes |
| `{section10}` | **Internal Links** | Links to other relevant articles |
| `{section11}` | **FAQs** | Frequently Asked Questions |
| `{section12}` | **CTA/Conclusion** | Call-to-Action and closing remarks |

### Method 1: Quick Insert Buttons

The easiest way to insert section markers is using the **Quick Insert** buttons in the left sidebar.

![Quick Insert Buttons](./app-screenshots/step-4-quick-insert.png)

**To insert a section:**

1. Click where you want to insert the section marker in the editor
2. Click the corresponding button in the "Quick Insert" panel (e.g., "section1 Hero/Title")
3. The marker will be automatically inserted at your cursor position

Example:

```
{section1}
My Blog Post Title

{section2}
This is the introductory paragraph that explains what readers will learn.

{section3}
1. Introduction
2. Main Benefits
3. How to Get Started
4. Conclusion

{section5}
Here is the main content of your blog post with detailed information...
```

### Method 2: Manual Typing

You can also manually type section markers directly in the editor:

Simply type `{section1}`, `{section2}`, etc. wherever you want to mark sections.

---

## Writing Your Blog Content

### Example Blog Post Structure

Here's a recommended structure for a well-organized blog post:

```
{section1}
Ultimate Guide to Professional Blog Writing

{section2}
Writing a professional blog post requires planning, research, and careful editing. This guide will teach you everything you need to know to create engaging, SEO-optimized content.

{section3}
What You'll Learn:
- The essential elements of a great blog post
- How to structure your content
- SEO best practices
- Image optimization techniques

{section4}
Key Benefits:
- Increased website traffic from search engines
- Established authority in your field
- Better engagement with your audience
- Higher conversion rates

{section5}
The foundation of great blog writing starts with a clear understanding of your audience. Know who you're writing for, what problems they face, and how your content solves those problems.

{section6}
Did you know? According to HubSpot, companies that publish 16+ blog posts per month get 4.5x more leads than those publishing 0-4 posts monthly.

{section9}
Step 1: Research Your Topic
Step 2: Create an Outline
Step 3: Write Your First Draft
Step 4: Add Visuals and Images
Step 5: Edit and Optimize
Step 6: Publish and Promote

{section11}
Q: How long should a blog post be?
A: Aim for 1,500-2,500 words for comprehensive guides.

Q: How often should I publish?
A: Consistency matters more than frequency. 2-4 posts per month is ideal.

{section12}
Start creating your first professional blog post today using these proven techniques. Share your insights with the world and build your authority!
```

---

## Generating HTML

### Step 1: Click "Generate Blog HTML"

Once you've written your content with section markers, scroll to the bottom of the editor and click the **"Generate Blog HTML"** button.

![Generate Button](./app-screenshots/step-5-generate-button.png)

### Step 2: Wait for Processing

The system will:
1. Validate your content and section markers
2. Check for any missing required sections
3. Extract any image keywords
4. Generate SEO-optimized HTML

You'll see: "Generating..." while processing

### Step 3: Check for Warnings

After generation, the system may display:

- **Validation Warnings** - Minor issues that don't prevent generation (yellow alert)
- **Missing Required Sections** - Critical sections that should be included (red alert)

Address any critical warnings and regenerate if needed.

---

## Image Upload

### When Images are Required

If your blog post references images (detected automatically), the system will show an **"Upload Images to Shopify"** card.

![Image Upload Section](./app-screenshots/step-6-image-upload.png)

### Uploading Images

**For each image:**

1. See the image keyword (e.g., "coffee-brewing", "office-setup")
2. Click the **"Upload"** button
3. Select an image file from your computer
4. The system uploads to Shopify automatically
5. Status shows: "✓ Uploaded" once complete

**Supported image formats:**
- `.jpg` / `.jpeg` - JPEG images
- `.png` - PNG images
- `.webp` - WebP images
- `.gif` - GIF images

### Modifying Images

- **Change Image**: Click "Change" to replace with a different image
- **Remove Image**: Click "Remove" to delete an uploaded image

### Important

All images must be uploaded before the final HTML can be generated. The "Generate Blog HTML" button will be disabled until all images are uploaded.

---

## Viewing & Exporting Results

### Step 1: Switch to Preview Tab

After successful generation, the system automatically switches to the **"Preview"** tab showing your generated HTML.

![Preview Tab](./app-screenshots/step-7-preview-tab.png)

### Step 2: View Your Generated HTML

The HTML code is displayed in a formatted box. This is your SEO-optimized blog post HTML.

### Step 3: Copy or Download

You have three options:

#### Option A: Copy to Clipboard
- Click **"Copy"** button
- The HTML is copied to your clipboard
- Paste it anywhere you need it

#### Option B: Download as File
- Click **"Download"** button
- An `blog-post.html` file downloads to your computer
- Open it in any web browser to see the formatted blog post

#### Option C: Publish to Shopify
- Click **"Publish to Shopify"** button
- A modal dialog opens for publishing configuration

---

## Publishing to Shopify

### Step 1: Click "Publish to Shopify"

In the Preview tab, click the green **"Publish to Shopify"** button.

![Publish Button](./app-screenshots/step-8-publish-button.png)

### Step 2: Configure Publication Details

A modal dialog appears where you'll enter:

![Publish Modal](./app-screenshots/step-9-publish-modal.png)

**Required Fields:**
- **Blog Title** * - The title of your blog post

**Optional Fields:**
- **Author** - Name of the blog post author
- **Tags** - Comma-separated tags (e.g., "technology, business, productivity")
- **Publication Date** - When the post should be published (defaults to today)

### Step 3: Fill in the Information

Example:
```
Blog Title: How to Optimize Your Blog for SEO
Author: John Smith
Tags: seo, blogging, digital-marketing
Publication Date: 2024-01-15
```

### Step 4: Publish

Click **"Publish"** to send your blog post to Shopify.

The system will:
1. Validate your blog post
2. Upload it to your Shopify store
3. Assign it a publication date
4. Add it to your blog section

**Success Message:** "Published to Shopify successfully!"

---

## Information Panel

The left sidebar includes an **"Info"** card that displays helpful metadata:

![Info Panel](./app-screenshots/step-10-info-panel.png)

**Information shown:**
- **Total Sections**: Total number of sections in your blog (always 12 available)
- **Words**: Word count of your generated blog post
- **Sections Used**: How many of the 12 sections you've included
- **Warnings**: Number of validation warnings (if any)

This helps you understand your content at a glance.

---

## Tips & Best Practices

### Content Organization
- **Start with section1** (Hero/Title) - Always begin with your main title
- **Follow with section2** (Intro Paragraph) - Set up your topic
- **Use section3** (Table of Contents) - Help readers navigate
- **Fill section4-11** - Your main content
- **End with section12** (CTA/Conclusion) - Strong closing with call-to-action

### SEO Optimization
- Use descriptive, keyword-rich section titles
- Write naturally for your readers first
- Include statistics and expert quotes for credibility
- Use internal links to other relevant content
- Include clear step-by-step instructions when applicable

### Image Best Practices
- Use high-quality images (at least 1200px wide)
- Compress images to reduce file size
- Use descriptive filenames for SEO
- Include alt text in your content descriptions

### Content Length
- Aim for 1,500-2,500 words total
- Vary section length for readability
- Shorter sections for steps and FAQs
- Longer sections for detailed explanations

### Regular Publishing
- Consistency beats perfection
- Publish 2-4 posts per month
- Follow a publishing schedule
- Update older posts with new information

---

## Troubleshooting

### Issue: "Unsupported file format"
**Solution:** Ensure your file is `.txt`, `.md`, or `.docx`. Rename if necessary.

### Issue: "Please write some content first"
**Solution:** Add content to the editor before clicking Generate. Include at least one section marker.

### Issue: "Missing Required Sections"
**Solution:** Review the warning list and add the missing section types to your content.

### Issue: "Images not uploading"
**Solution:** 
- Check image file format (JPG, PNG, WebP, or GIF)
- Ensure image file size isn't too large
- Check your internet connection

### Issue: "Failed to publish to Shopify"
**Solution:**
- Verify your Shopify connection is configured
- Check that all required fields are filled
- Try again in a few moments

### Issue: HTML looks different in browser
**Solution:** The preview shows raw HTML code. Open the downloaded `.html` file in a web browser to see the formatted result.

---

## Keyboard Shortcuts

- **Focus on Editor**: Click in the text area
- **Insert Section**: Use Quick Insert buttons in sidebar
- **Switch Tabs**: Click "Editor" or "Preview"

---

## File Size Limits

- **Document Upload**: No official limit, but typically up to 10MB
- **Image Upload**: Recommended up to 5MB per image
- **Generated HTML**: Depends on content length and images included

---

## Support & Help

If you encounter issues:
1. Check the validation warnings in the Info panel
2. Review the Tips & Best Practices section
3. Verify all required sections are included
4. Try uploading images again if that's the issue

---

## Summary

The Blog Generator streamlines the blog creation process:

1. **Write** your content or upload a document
2. **Organize** with section markers (12 types available)
3. **Generate** SEO-optimized HTML automatically
4. **Upload** any images to Shopify
5. **Publish** directly to your Shopify store or export as HTML

With these tools, you can create professional, SEO-optimized blog posts in minutes instead of hours.

---

**Happy blogging!**
