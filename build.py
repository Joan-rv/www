import os
import shutil

def ensure_dir(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)

def with_template(content):
    with open("templates/post.html") as template:
        template = template.read()
        template_lines = template.splitlines()
        indentation = None
        for line in template_lines:
            if "{{ content }}" in line:
                indentation = len(line) - len(line.lstrip(" "))
        assert indentation, "Missing {{ content }} replacement in template"
        content = "\n".join((" " * indentation + line for line in content.splitlines()))
        return template.replace(" " * indentation + "{{ content }}", content)

def handle_dir(in_path, out_path):
    for resource in os.listdir(in_path):
        shutil.copy2(f"{in_path}/{resource}", f"{out_path}/{resource}")

    in_path += "/index.html"
    out_path += "/index.html"
    ensure_dir(out_path)
    with open(in_path) as input:
        content = input.read()
    with open(out_path, "w") as output:
        output.write(with_template(content))

for category in os.listdir("posts"):
    posts = []

    for post in os.listdir(f"posts/{category}"):
        posts.append(post)
        out_path = f"srv/{category}/{post}"
        in_path = f"posts/{category}/{post}"
        if os.path.isdir(in_path):
            handle_dir(in_path, out_path)
        else:
            assert False, "Can only handle directories"

    list_items = "\n".join(
        [f"  <li><a href=\"{post}\">{post}</a></li>" for post in posts]
    )
    listing = f"<ul>\n{list_items}\n</ul>"
    listing_path = f"srv/{category}/index.html"
    ensure_dir(listing_path)
    with open(listing_path, "w") as listing_file:
        listing_file.write(with_template(listing))
