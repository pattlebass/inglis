import os
import json
import re

# CONFIG
INPUT_FOLDER = "./tools/input"  # folder containing input files
OUTPUT_FOLDER = "./json/dictionaries"  # folder to save outputs
CONVERSION_DICTS = [
    "ro"
]  # list of conversion dicts (filenames without 'ipa_to_' prefix)

clean_re = re.compile(r"[ˈˌːˑ̥̬̩̯̪̺̝̞̃̊̍̑ʰʲˠ˞‖|͡↗↘⁀‿\./\u0300-\u036F]")


# Load IPA → readable mapping
def load_mapping(lang):
    mapping_file = f"tools/ipa_to_{lang}.json"
    with open(mapping_file, "r", encoding="utf-8") as f:
        return json.load(f)


# Tokenizer (longest match)
def tokenize_ipa(ipa, phonemes):
    ipa = clean_re.sub("", ipa).strip()
    tokens = []
    i = 0
    while i < len(ipa):
        matched = False
        for ph in phonemes:
            if ipa.startswith(ph, i):
                tokens.append(ph)
                i += len(ph)
                matched = True
                break
        if not matched:
            tokens.append(ipa[i])
            i += 1
    return tokens


# Convert IPA to readable
def ipa_to_readable(ipa, phonemes, mapping):
    tokens = tokenize_ipa(ipa, phonemes)
    return "".join(mapping.get(tok, tok) for tok in tokens).lower()


# Process a line
def process_line(line, phonemes, mapping):
    parts = line.strip().split("\t")
    if len(parts) != 2:
        return None, None
    entry = parts[0].strip().lower()
    ipa_raw = parts[1]
    ipa_list = [i.strip() for i in ipa_raw.split(",")]
    readable_list = []
    for ipa in ipa_list:
        val = ipa_to_readable(ipa, phonemes, mapping)
        if val and val not in readable_list:
            readable_list.append(val)

    return entry, readable_list


# Main processing
def main():
    # List all input files (ignore directories)
    input_files = [
        f
        for f in os.listdir(INPUT_FOLDER)
        if os.path.isfile(os.path.join(INPUT_FOLDER, f))
    ]

    for conv_dict in CONVERSION_DICTS:
        mapping = load_mapping(conv_dict)
        phonemes = sorted(mapping.keys(), key=len, reverse=True)

        # Ensure output folder for this conversion dict exists
        out_folder = os.path.join(OUTPUT_FOLDER, conv_dict)
        os.makedirs(out_folder, exist_ok=True)

        for filename in input_files:
            input_path = os.path.join(INPUT_FOLDER, filename)
            result = {}

            with open(input_path, "r", encoding="utf-8") as f:
                for line in f:
                    if not line.strip():
                        continue
                    entry, readable_list = process_line(line, phonemes, mapping)
                    if " " in entry:
                        continue  # skip multi-word entries
                    if entry and readable_list:
                        result[entry] = readable_list

            # Safe file path: use only the folder for os.makedirs
            base_name = os.path.splitext(filename)[0]
            output_file = os.path.join(out_folder, f"{base_name}.json")

            with open(output_file, "w", encoding="utf-8") as out_f:
                json.dump(
                    result,
                    out_f,
                    ensure_ascii=False,
                )


if __name__ == "__main__":
    main()
