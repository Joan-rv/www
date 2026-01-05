import os
import shutil

TEMPLATE_PATH = "templates/post.html"


def ensure_dir(path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)


def load_template():
    """Reads the template once."""
    with open(TEMPLATE_PATH) as f:
        return f.read()


def with_template(content: str, template: str) -> str:
    """Injects content into the template, respecting indentation."""
    template_lines = template.splitlines()
    indentation = None
    for line in template_lines:
        if "{{ content }}" in line:
            indentation = len(line) - len(line.lstrip(" "))
            break

    if indentation is None:
        return content

    indented_content = "\n".join(
        (" " * indentation + line for line in content.splitlines()))
    return template.replace(" " * indentation + "{{ content }}",
                            indented_content)


def is_full_html(content: str) -> bool:
    """Checks if the content looks like a full HTML document."""
    return "<!DOCTYPE html>" in content or "<html" in content


def handle_dir(in_path: str, out_path: str, template: str):
    os.makedirs(out_path, exist_ok=True)

    for resource in os.listdir(in_path):
        src = os.path.join(in_path, resource)
        dst = os.path.join(out_path, resource)
        if os.path.isfile(src):
            shutil.copy2(src, dst)

    index_in = os.path.join(in_path, "index.html")
    index_out = os.path.join(out_path, "index.html")

    if os.path.exists(index_in):
        with open(index_in) as f:
            content = f.read()

        if not is_full_html(content):
            final_content = with_template(content, template)
            with open(index_out, "w") as f:
                f.write(final_content)


def main():
    if os.path.exists("srv"):
        shutil.rmtree("srv")
    os.makedirs("srv")

    template = load_template()

    for file in os.listdir("static"):
        src = os.path.join("static", file)
        dst = os.path.join("srv", file)
        if os.path.isfile(src):
            shutil.copy2(src, dst)

    if os.path.exists("posts"):
        for category in os.listdir("posts"):
            category_path = os.path.join("posts", category)
            if not os.path.isdir(category_path):
                continue

            posts = []
            for post in os.listdir(category_path):
                in_path = os.path.join(category_path, post)
                out_path = os.path.join("srv", category, post)

                if os.path.isdir(in_path):
                    posts.append(post)
                    handle_dir(in_path, out_path, template)

            list_items = "\n".join(
                (f"  <li><a href=\"{post}/\">{post}</a></li>"
                 for post in posts))
            listing = f"<h1>{category.capitalize()}</h1>\n<ul>\n{list_items}\n</ul>"

            listing_path = os.path.join("srv", category, "index.html")
            ensure_dir(listing_path)
            with open(listing_path, "w") as f:
                f.write(with_template(listing, template))


if __name__ == "__main__":
    main()
