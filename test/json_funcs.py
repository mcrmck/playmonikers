"""
Functions to get information on the cards.json file to help with 
formatting, etc.
"""
import json

def get_longest_name(json):
    """
    Gets the card with the most characters
    """
    longest_name = max(json, key=lambda x:len(x['name']))
    print(f'Longest name: {longest_name}')
    return len(longest_name['name'])

def get_longest_desc(json):
    """
    Gets the card with the longest description
    """
    longest_desc = max(json, key=lambda x:len(x['description']))
    print(f'Longest description: {longest_desc}')
    return len(longest_desc['description'])

def get_longest_combined(json):
    """
    Gets the card with the longest combined name and description
    """
    longest = max(json, key=lambda x:len(x['name']) + len(x['description']))
    print(f'Longest total: {longest}')
    return len(longest['name']) + len(longest['description'])

def get_shortest_combined(json):
    """
    Gets the card with the shortest combined name and description
    """
    shortest = min(json, key=lambda x:len(x['name']) + len(x['description']))
    print(f'Shortest total: {shortest}')
    return len(shortest['name']) + len(shortest['description'])

if __name__ == "__main__":
    with open('../src/public/js/cards.json', 'r') as f:
        json_data = f.read()
    cards = json.loads(json_data)
    print(f'Value: {get_longest_name(cards)}\n')
    print(f'Value: {get_longest_desc(cards)}\n')
    print(f'Value: {get_longest_combined(cards)}\n')
    print(f'Value: {get_shortest_combined(cards)}\n')
